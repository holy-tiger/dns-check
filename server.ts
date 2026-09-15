import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dns from 'dns';
import net from 'net';
import tls from 'tls';
import http from 'http';
import https from 'https';
import { URL } from 'url';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Trust reverse proxies (nginx, Cloud Run, Docker, CDN) to accurately read client IP
app.set('trust proxy', true);

app.use(express.json({ limit: '2mb' }));

interface TargetParsed {
  original: string;
  hostname: string;
  protocol: 'http:' | 'https:';
  port: number;
  pathname: string;
  isIp: boolean;
}

function parseTarget(input: string): TargetParsed {
  const trimmed = input.trim();
  let candidate = trimmed;

  // If no scheme specified
  if (!/^https?:\/\//i.test(candidate)) {
    if (candidate.includes(':80') && !candidate.includes(':8080')) {
      candidate = 'http://' + candidate;
    } else {
      candidate = 'https://' + candidate;
    }
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    // Fallback simple parsing
    const cleanHost = trimmed.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
    const [hostPart, portPart] = cleanHost.split(':');
    return {
      original: input,
      hostname: hostPart,
      protocol: 'https:',
      port: portPart ? parseInt(portPart, 10) : 443,
      pathname: '/',
      isIp: net.isIP(hostPart) !== 0,
    };
  }

  const isIp = net.isIP(parsed.hostname) !== 0;
  const protocol = (parsed.protocol.toLowerCase() === 'http:' ? 'http:' : 'https:') as 'http:' | 'https:';
  const defaultPort = protocol === 'http:' ? 80 : 443;
  const port = parsed.port ? parseInt(parsed.port, 10) : defaultPort;

  return {
    original: input,
    hostname: parsed.hostname,
    protocol,
    port,
    pathname: parsed.pathname || '/',
    isIp,
  };
}

// Timeout promise wrapper
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(timeoutMsg);
      (err as unknown as { code: string }).code = 'ETIMEDOUT';
      reject(err);
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

type StepStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped';
type SupportedLang = 'zh' | 'en' | 'ar';

interface StepObj {
  name: string;
  status: StepStatus;
  timeMs: number;
  error?: string;
}

// Multilingual text dictionaries for diagnostic outputs
const SERVER_I18N = {
  dns: {
    name: {
      zh: 'DNS 域名解析',
      en: 'DNS Resolution',
      ar: 'تحليل DNS',
    },
    notFoundReason: {
      zh: '域名不存在或未配置解析记录 (NXDOMAIN / ENOTFOUND)',
      en: 'Domain does not exist or has no DNS records (NXDOMAIN / ENOTFOUND)',
      ar: 'النطاق غير موجود أو لم يتم تكوين سجلات DNS له (NXDOMAIN / ENOTFOUND)',
    },
    notFoundSuggestion: {
      zh: '该域名可能未在权威 DNS 服务器注册，或者域名前缀拼写有误，或是域名解析已暂停或到期。',
      en: 'The domain might not be registered, misspelled, or DNS records have expired/been paused.',
      ar: 'قد يكون اسم النطاق غير مسجل، أو يحتوي على خطأ إملائي، أو تم إيقاف أو انتهاء سجلات DNS الخاصة به.',
    },
    timeoutReason: {
      zh: 'DNS 查询超时',
      en: 'DNS query timed out',
      ar: 'انتهت مهلة استعلام DNS',
    },
    timeoutSuggestion: {
      zh: '当前使用的 DNS 服务器响应超时。请尝试切换为公共 DNS（如 8.8.8.8 或 1.1.1.1）测试。',
      en: 'The current DNS resolver timed out. Try switching to a public DNS like 8.8.8.8 or 1.1.1.1.',
      ar: 'انتهت مهلة استجابة خادم DNS. حاول التبديل إلى خادم عام مثل 8.8.8.8 أو 1.1.1.1.',
    },
    servfailReason: {
      zh: 'DNS 服务器返回故障 (SERVFAIL)',
      en: 'DNS server returned failure (SERVFAIL)',
      ar: 'فشل في استجابة خادم DNS (SERVFAIL)',
    },
    servfailSuggestion: {
      zh: 'DNS 递归解析器在向上游权威服务器查询时遇到问题，通常是域名的权威 DNS 服务器配置异常或网络中断。',
      en: 'Recursive resolver failed to reach authoritative servers, usually due to misconfiguration or upstream network issue.',
      ar: 'فشل المحلل التكراري في الوصول إلى الخوادم الرسمية للنطاق، غالبًا بسبب خطأ في التكوين أو انقطاع الاتصال.',
    },
    refusedReason: {
      zh: 'DNS 服务器拒绝查询请求 (REFUSED)',
      en: 'DNS server refused query (REFUSED)',
      ar: 'خادم DNS رفض استعلام التحليل (REFUSED)',
    },
    refusedSuggestion: {
      zh: 'DNS 服务器拒绝了本次解析查询，可能存在访问限制或策略拦截。',
      en: 'The DNS server actively refused the query. Check access restrictions or firewall policies.',
      ar: 'رفض خادم DNS الاستعلام بصورة مباشرة. تحقق من قيود الوصول أو جدار الحماية.',
    },
    nodataReason: {
      zh: '域名存在但无有效的 A / AAAA 记录 (NODATA)',
      en: 'Domain exists but has no valid A or AAAA records (NODATA)',
      ar: 'اسم النطاق موجود ولكن لا يحتوي على سجلات A أو AAAA صالحة (NODATA)',
    },
    nodataSuggestion: {
      zh: '该域名已注册，但未绑定任何 IPv4/IPv6 主机地址。',
      en: 'The domain is registered but has not been mapped to any IPv4/IPv6 host address.',
      ar: 'النطاق مسجل بالفعل، لكن لم يتم ربطه بأي عنوان مضيف IPv4 أو IPv6 حتى الآن.',
    },
    defaultReason: {
      zh: 'DNS 解析异常',
      en: 'DNS resolution anomaly',
      ar: 'خلل في تحليل نظام أسماء النطاقات (DNS)',
    },
    defaultSuggestion: {
      zh: '请检查域名拼写或 DNS 服务器配置。',
      en: 'Please verify the domain spelling or DNS resolver settings.',
      ar: 'يرجى التحقق من صحة كتابة النطاق أو إعدادات خادم DNS.',
    },
  },
  tcp: {
    name: {
      zh: 'TCP 端口连通',
      en: 'TCP Handshake',
      ar: 'اتصال ومصافحة TCP',
    },
    refusedReason: {
      zh: '端口连接被目标服务器拒绝 (ECONNREFUSED)',
      en: 'Port connection refused by target server (ECONNREFUSED)',
      ar: 'تم رفض الاتصال بالمنفذ من قبل الخادم الهدف (ECONNREFUSED)',
    },
    refusedSuggestion: {
      zh: '目标服务器可达但未在指定端口监听服务，或安全组/防火墙主动阻断。请确认服务端口是否启动。',
      en: 'The server host is reachable but not listening on this port, or a firewall sent a TCP RST. Check if the port service is running.',
      ar: 'يمكن الوصول إلى الخادم الهدف ولكن لا توجد خدمة تستمع على هذا المنفذ، أو تم الرفض عبر جدار الحماية. تأكد من تشغيل الخدمة على المنفذ.',
    },
    timeoutReason: {
      zh: 'TCP 连接握手超时',
      en: 'TCP connection handshake timed out',
      ar: 'انتهت مهلة مصافحة اتصال TCP',
    },
    timeoutSuggestion: {
      zh: '目标主机未能在规定时间内返回 SYN-ACK 响应。可能原因：服务器未开机、防火墙静默丢包 (Drop) 或网络路由阻断。',
      en: 'Target host failed to send SYN-ACK within timeout. Possible causes: host down, firewall dropping packets, or routing block.',
      ar: 'فشل المضيف الهدف في إرسال استجابة SYN-ACK ضمن الوقت المحدد. الأسباب المحتملة: إيقاف تشغيل الخادم، أو جدار الحماية يسقط الحزم، أو حظر المسار.',
    },
    unreachReason: {
      zh: '目标主机路由不可达 (EHOSTUNREACH / ENETUNREACH)',
      en: 'Host or network unreachable (EHOSTUNREACH / ENETUNREACH)',
      ar: 'المضيف أو الشبكة الهدف غير قابلة للوصول (EHOSTUNREACH / ENETUNREACH)',
    },
    unreachSuggestion: {
      zh: '底层路由器未能找到到达目标 IP 地址的有效路由，可能是中间网络链路中断。',
      en: 'No route to the target IP address could be established. Check upstream internet connectivity.',
      ar: 'تعذر إنشاء مسار توجيه نحو عنوان IP الهدف. تحقق من سلامة مسار الشبكة الوسيط.',
    },
    resetReason: {
      zh: '连接在建立过程中被重置 (ECONNRESET)',
      en: 'Connection reset by peer or intermediate firewall (ECONNRESET)',
      ar: 'تمت إعادة تعيين الاتصال قسراً (ECONNRESET)',
    },
    resetSuggestion: {
      zh: '连接被对端服务器或中间安全防火墙强制中断并发送了 RST 复位包。',
      en: 'Connection was forcefully terminated by remote host or security appliance with a TCP RST packet.',
      ar: 'تم إنهاء الاتصال قسرًا من قبل الخادم البعيد أو جدار الحماية بإرسال حزمة RST.',
    },
    defaultReason: {
      zh: 'TCP 连接建立失败',
      en: 'TCP connection failed',
      ar: 'فشل إنشاء اتصال TCP',
    },
    defaultSuggestion: {
      zh: '无法与目标服务器端口建立通信。',
      en: 'Unable to establish socket communication with the target port.',
      ar: 'تعذر إنشاء اتصال مقبس مع المنفذ المحدد.',
    },
  },
  tls: {
    name: {
      zh: 'TLS 握手与证书',
      en: 'TLS Certificate',
      ar: 'شهادة ومصافحة TLS',
    },
    expiredReason: {
      zh: 'SSL 证书已过期 (CERT_HAS_EXPIRED)',
      en: 'SSL certificate has expired (CERT_HAS_EXPIRED)',
      ar: 'انتهت صلاحية شهادة SSL (CERT_HAS_EXPIRED)',
    },
    expiredSuggestion: {
      zh: '服务器证书已到期失效，需重新申请或续签有效证书。',
      en: 'The server SSL certificate has passed its expiration date. Renewal is required.',
      ar: 'انتهت فترة صلاحية شهادة الخادم. يلزم تجديد الشهادة أو استخراج شهادة جديدة صالحة.',
    },
    altnameReason: {
      zh: '证书域名与访问域名不匹配 (ERR_TLS_CERT_ALTNAME_INVALID)',
      en: 'Certificate hostname mismatch (ERR_TLS_CERT_ALTNAME_INVALID)',
      ar: 'اسم نطاق الشهادة لا يطابق النطاق المطلوب (ERR_TLS_CERT_ALTNAME_INVALID)',
    },
    altnameSuggestion: {
      zh: '证书颁发的主体名称与当前请求的域名不一致。请检查证书覆盖域名列表 (SAN)。',
      en: 'The certificate subject alternative name (SAN) does not match the requested hostname.',
      ar: 'اسم المضيف في الشهادة لا يطابق النطاق المستعلم عنه. تحقق من أسماء النطاقات البديلة (SAN) في الشهادة.',
    },
    selfSignedReason: {
      zh: '检测到自签名证书 (SELF_SIGNED_CERT)',
      en: 'Self-signed certificate detected (SELF_SIGNED_CERT)',
      ar: 'تم اكتشاف شهادة موقعة ذاتيًا (SELF_SIGNED_CERT)',
    },
    selfSignedSuggestion: {
      zh: '该证书是由服务器自行生成的私有证书，未经公认权威 CA 机构签名。',
      en: 'The certificate was issued by an untrusted or self-generated authority rather than a recognized CA.',
      ar: 'الشهادة موقعة ذاتيًا أو صادرة عن جهة خاصة غير معتمدة من سلطات الشهادات العامة.',
    },
    timeoutReason: {
      zh: 'TLS 握手超时',
      en: 'TLS handshake timed out',
      ar: 'انتهت مهلة مصافحة TLS',
    },
    timeoutSuggestion: {
      zh: '在完成 TLS 握手与证书交换之前连接超时，可能存在高延迟或中间设备拦截。',
      en: 'Connection timed out during TLS cipher negotiation and certificate exchange.',
      ar: 'انتهت مهلة الاتصال أثناء التفاوض على التشفير وتبادل الشهادات في مصافحة TLS.',
    },
    defaultReason: {
      zh: 'TLS 证书安全验证未通过',
      en: 'TLS certificate verification failed',
      ar: 'فشل التحقق الأمني من شهادة TLS',
    },
    defaultSuggestion: {
      zh: '无法与目标服务器完成 SSL/TLS 握手，请核对是否支持相应 TLS 版本或密码套件。',
      en: 'Failed to negotiate SSL/TLS session. Verify TLS protocol versions and supported cipher suites.',
      ar: 'فشل التفاوض على جلسة SSL/TLS. تحقق من إصدارات البروتوكول وتوافق مجموعات التشفير.',
    },
  },
  http: {
    name: {
      zh: 'HTTP 协议响应',
      en: 'HTTP Response',
      ar: 'استجابة بروتوكول HTTP',
    },
    unauthReason: {
      zh: 'HTTP 访问受限或未授权',
      en: 'HTTP Access Denied / Unauthorized',
      ar: 'تم رفض الوصول أو غير مصرح به عبر HTTP',
    },
    unauthSuggestion: {
      zh: '目标服务启用了访问权限控制、密码保护或对检测来源设置了防火墙 WAF 限制。',
      en: 'Access control, basic authentication, or a Web Application Firewall (WAF) is blocking this request.',
      ar: 'تم تمكين التحكم في الوصول أو الحماية أو أن جدار حماية تطبيقات الويب (WAF) يحظر الطلب.',
    },
    notFoundReason: {
      zh: 'HTTP 404 资源未找到',
      en: 'HTTP 404 Not Found',
      ar: 'المورد المطلوب غير موجود HTTP 404',
    },
    notFoundSuggestion: {
      zh: '目标服务器正在运行，但请求的 URL 路径不存在。',
      en: 'The web server is running, but the requested endpoint or resource was not found.',
      ar: 'خادم الويب يعمل بشكل سليم، لكن المسار أو المورد المطلوب غير موجود.',
    },
    internalErrorReason: {
      zh: 'HTTP 500 服务器内部错误',
      en: 'HTTP 500 Internal Server Error',
      ar: 'خطأ داخلي في الخادم HTTP 500',
    },
    internalErrorSuggestion: {
      zh: '目标服务器后端程序在处理请求时发生未捕获异常或崩溃。',
      en: 'The target backend application encountered an unhandled exception or crash while processing.',
      ar: 'واجه تطبيق الخادم الخلفي خطأ غير معالج أو انهياراً أثناء معالجة الطلب.',
    },
    badGatewayReason: {
      zh: 'HTTP 502 网关错误 (Bad Gateway)',
      en: 'HTTP 502 Bad Gateway',
      ar: 'بوابة غير صالحة HTTP 502 (Bad Gateway)',
    },
    badGatewaySuggestion: {
      zh: '反向代理服务器（如 Nginx、Cloudflare）无法从上游源站获取到正常的响应。',
      en: 'The reverse proxy / gateway (e.g. Nginx, Cloudflare) received an invalid response from the upstream origin.',
      ar: 'تعذر على خادم الوكيل العكسي (مثل Nginx أو Cloudflare) تلقي استجابة صالحة من الخادم الأصلي.',
    },
    unavailableReason: {
      zh: 'HTTP 503 服务暂不可用 (Service Unavailable)',
      en: 'HTTP 503 Service Unavailable',
      ar: 'الخدمة غير متوفرة مؤقتًا HTTP 503',
    },
    unavailableSuggestion: {
      zh: '服务器当前处于高负载状态或正在进行临时停机维护。',
      en: 'The server is currently overloaded or undergoing temporary maintenance.',
      ar: 'الخادم يمر بحالة ضغط شديد حالياً أو يخضع لأعمال صيانة مؤقتة.',
    },
    gatewayTimeoutReason: {
      zh: 'HTTP 504 网关超时 (Gateway Timeout)',
      en: 'HTTP 504 Gateway Timeout',
      ar: 'انتهاء مهلة البوابة HTTP 504',
    },
    gatewayTimeoutSuggestion: {
      zh: '代理网关在等待后端源站响应时超时。',
      en: 'The proxy gateway timed out waiting for the upstream origin server to respond.',
      ar: 'انتهت مهلة استجابة الخادم الأصلي أثناء انتظار البوابة الوسيطة.',
    },
    defaultReason: {
      zh: 'HTTP 响应状态码异常',
      en: 'Abnormal HTTP status code',
      ar: 'رمز حالة استجابة HTTP غير طبيعي',
    },
    defaultSuggestion: {
      zh: '服务器网络和端口连通正常，但在应用服务层返回了错误。',
      en: 'Network and TCP ports are reachable, but an application-level error occurred.',
      ar: 'الشبكة ومنافذ TCP قابلة للوصول، ولكن حدث خطأ على مستوى تطبيق الويب.',
    },
  },
  summary: {
    ok: {
      zh: 'DNS 解析正常 ({ip})，TCP 握手与服务响应良好 ({time}ms)',
      en: 'DNS resolved successfully ({ip}), TCP handshake and service healthy ({time}ms)',
      ar: 'تحليل DNS سليم ({ip})، ومصافحة TCP واستجابة الخدمة ممتازة ({time} مللي ثانية)',
    },
    dnsFailed: {
      zh: 'DNS 解析失败: {reason}',
      en: 'DNS resolution failed: {reason}',
      ar: 'فشل تحليل DNS: {reason}',
    },
    tcpFailed: {
      zh: '服务器连接失败: {reason}',
      en: 'Server connection failed: {reason}',
      ar: 'فشل الاتصال بالخادم: {reason}',
    },
    tlsFailed: {
      zh: 'TLS 证书异常: {reason}',
      en: 'TLS certificate anomaly: {reason}',
      ar: 'خلل في شهادة TLS: {reason}',
    },
    httpFailed: {
      zh: 'HTTP 服务异常: {reason}',
      en: 'HTTP service anomaly: {reason}',
      ar: 'خلل في خدمة HTTP: {reason}',
    },
  },
};

async function performDnsCheck(hostname: string, customDns?: string, timeoutMs: number = 5000, lang: SupportedLang = 'zh') {
  const startTime = Date.now();

  if (net.isIP(hostname) !== 0) {
    return {
      success: true,
      timeMs: 0,
      isDirectIp: true,
      resolvedIp: hostname,
      records: {
        a: [hostname],
        aaaa: [],
        cname: [],
      },
    };
  }

  try {
    const resolver = customDns && customDns.trim()
      ? new dns.promises.Resolver()
      : dns.promises;

    if (customDns && customDns.trim() && resolver instanceof dns.promises.Resolver) {
      resolver.setServers([customDns.trim()]);
    }

    const dnsPromise = (async () => {
      let aRecords: string[] = [];
      let aaaaRecords: string[] = [];
      let cnameRecords: string[] = [];

      try {
        aRecords = await resolver.resolve4(hostname);
      } catch (e: unknown) {
        const err = e as { code?: string };
        // If nodata, it just means no IPv4
        if (err.code !== 'ENODATA' && err.code !== 'ENOTFOUND') {
          // If another fatal error, we might still check AAAA or rethrow
        }
      }

      try {
        aaaaRecords = await resolver.resolve6(hostname);
      } catch {
        // optional IPv6
      }

      try {
        cnameRecords = await resolver.resolveCname(hostname);
      } catch {
        // optional CNAME
      }

      // If both A and AAAA failed, try fallback lookup
      if (aRecords.length === 0 && aaaaRecords.length === 0) {
        const lookupRes = await dns.promises.lookup(hostname, { all: true });
        for (const item of lookupRes) {
          if (item.family === 4) aRecords.push(item.address);
          if (item.family === 6) aaaaRecords.push(item.address);
        }
      }

      if (aRecords.length === 0 && aaaaRecords.length === 0) {
        const notFoundErr = new Error(`无法找到该域名的 IP 记录 (NXDOMAIN / ENOTFOUND)`);
        (notFoundErr as unknown as { code: string }).code = 'ENOTFOUND';
        throw notFoundErr;
      }

      return {
        a: aRecords,
        aaaa: aaaaRecords,
        cname: cnameRecords,
      };
    })();

    const records = await withTimeout(dnsPromise, timeoutMs, `DNS 查询超时 (${timeoutMs}ms)`);
    const timeMs = Date.now() - startTime;
    const resolvedIp = records.a[0] || records.aaaa[0];

    return {
      success: true,
      timeMs,
      resolvedIp,
      records,
    };
  } catch (err: unknown) {
    const timeMs = Date.now() - startTime;
    const errorObj = err as { code?: string; message?: string };
    const code = errorObj.code || 'UNKNOWN_DNS_ERROR';
    let humanReason = SERVER_I18N.dns.defaultReason[lang] || SERVER_I18N.dns.defaultReason.zh;
    let suggestion = SERVER_I18N.dns.defaultSuggestion[lang] || SERVER_I18N.dns.defaultSuggestion.zh;

    switch (code) {
      case 'ENOTFOUND':
      case 'NXDOMAIN':
        humanReason = SERVER_I18N.dns.notFoundReason[lang] || SERVER_I18N.dns.notFoundReason.zh;
        suggestion = SERVER_I18N.dns.notFoundSuggestion[lang] || SERVER_I18N.dns.notFoundSuggestion.zh;
        break;
      case 'ETIMEDOUT':
        humanReason = `${SERVER_I18N.dns.timeoutReason[lang] || SERVER_I18N.dns.timeoutReason.zh} (${timeoutMs}ms)`;
        suggestion = SERVER_I18N.dns.timeoutSuggestion[lang] || SERVER_I18N.dns.timeoutSuggestion.zh;
        break;
      case 'ESERVFAIL':
        humanReason = SERVER_I18N.dns.servfailReason[lang] || SERVER_I18N.dns.servfailReason.zh;
        suggestion = SERVER_I18N.dns.servfailSuggestion[lang] || SERVER_I18N.dns.servfailSuggestion.zh;
        break;
      case 'EREFUSED':
        humanReason = SERVER_I18N.dns.refusedReason[lang] || SERVER_I18N.dns.refusedReason.zh;
        suggestion = SERVER_I18N.dns.refusedSuggestion[lang] || SERVER_I18N.dns.refusedSuggestion.zh;
        break;
      case 'ENODATA':
        humanReason = SERVER_I18N.dns.nodataReason[lang] || SERVER_I18N.dns.nodataReason.zh;
        suggestion = SERVER_I18N.dns.nodataSuggestion[lang] || SERVER_I18N.dns.nodataSuggestion.zh;
        break;
      default:
        humanReason = `${SERVER_I18N.dns.defaultReason[lang] || SERVER_I18N.dns.defaultReason.zh}: ${errorObj.message || code}`;
        break;
    }

    return {
      success: false,
      timeMs,
      error: humanReason,
      code,
      rawMessage: errorObj.message || String(err),
      suggestion,
    };
  }
}

// Stage 2: TCP Connection Check
function performTcpCheck(host: string, port: number, timeoutMs: number = 5000, lang: SupportedLang = 'zh'): Promise<{
  success: boolean;
  timeMs: number;
  error?: string;
  code?: string;
  rawMessage?: string;
  suggestion?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let isSettled = false;

    socket.setTimeout(timeoutMs);

    socket.connect(port, host, () => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      socket.destroy();
      resolve({
        success: true,
        timeMs,
      });
    });

    socket.on('timeout', () => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      socket.destroy();
      resolve({
        success: false,
        timeMs,
        code: 'ETIMEDOUT',
        error: `${SERVER_I18N.tcp.timeoutReason[lang] || SERVER_I18N.tcp.timeoutReason.zh} (${timeoutMs}ms)`,
        suggestion: SERVER_I18N.tcp.timeoutSuggestion[lang] || SERVER_I18N.tcp.timeoutSuggestion.zh,
      });
    });

    socket.on('error', (err: unknown) => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      socket.destroy();

      const errorObj = err as { code?: string; message?: string };
      const code = errorObj.code || 'TCP_CONNECT_ERROR';
      let humanReason = `${SERVER_I18N.tcp.defaultReason[lang] || SERVER_I18N.tcp.defaultReason.zh} (${code})`;
      let suggestion = SERVER_I18N.tcp.defaultSuggestion[lang] || SERVER_I18N.tcp.defaultSuggestion.zh;

      switch (code) {
        case 'ECONNREFUSED':
          humanReason = `${SERVER_I18N.tcp.refusedReason[lang] || SERVER_I18N.tcp.refusedReason.zh} (${port})`;
          suggestion = SERVER_I18N.tcp.refusedSuggestion[lang] || SERVER_I18N.tcp.refusedSuggestion.zh;
          break;
        case 'EHOSTUNREACH':
        case 'ENETUNREACH':
          humanReason = SERVER_I18N.tcp.unreachReason[lang] || SERVER_I18N.tcp.unreachReason.zh;
          suggestion = SERVER_I18N.tcp.unreachSuggestion[lang] || SERVER_I18N.tcp.unreachSuggestion.zh;
          break;
        case 'ECONNRESET':
          humanReason = SERVER_I18N.tcp.resetReason[lang] || SERVER_I18N.tcp.resetReason.zh;
          suggestion = SERVER_I18N.tcp.resetSuggestion[lang] || SERVER_I18N.tcp.resetSuggestion.zh;
          break;
        default:
          humanReason = `${SERVER_I18N.tcp.defaultReason[lang] || SERVER_I18N.tcp.defaultReason.zh}: ${errorObj.message || code}`;
          break;
      }

      resolve({
        success: false,
        timeMs,
        code,
        error: humanReason,
        rawMessage: errorObj.message || String(err),
        suggestion,
      });
    });
  });
}

// Stage 3: TLS / SSL Check
function performTlsCheck(hostname: string, port: number, timeoutMs: number = 5000, lang: SupportedLang = 'zh'): Promise<{
  success: boolean;
  timeMs: number;
  cert?: {
    subject: string;
    issuer: string;
    validFrom: string;
    validTo: string;
    daysRemaining: number;
    isExpired: boolean;
    protocol?: string;
    authorized?: boolean;
  };
  error?: string;
  code?: string;
  rawMessage?: string;
  suggestion?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let isSettled = false;

    const options: tls.ConnectionOptions = {
      host: hostname,
      port,
      servername: hostname,
      timeout: timeoutMs,
      rejectUnauthorized: false, // allow inspection even if invalid cert
    };

    const socket = tls.connect(options, () => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      const cert = socket.getPeerCertificate(true);
      const protocol = socket.getProtocol() || 'TLS';
      const authorized = socket.authorized;
      const authError = socket.authorizationError;

      let validFrom = '';
      let validTo = '';
      let daysRemaining = 0;
      let isExpired = false;
      let issuer = 'Unknown';
      let subject = 'Unknown';

      if (cert && Object.keys(cert).length > 0) {
        validFrom = cert.valid_from;
        validTo = cert.valid_to;
        const expiryDate = new Date(validTo).getTime();
        daysRemaining = Math.round((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
        isExpired = daysRemaining < 0;

        if (cert.issuer) {
          issuer = (cert.issuer.O as string) || (cert.issuer.CN as string) || JSON.stringify(cert.issuer);
        }
        if (cert.subject) {
          subject = (cert.subject.CN as string) || JSON.stringify(cert.subject);
        }
      }

      socket.destroy();

      if (!authorized) {
        const authErrStr = authError ? (typeof authError === 'string' ? authError : (authError.message || String(authError))) : 'UNVERIFIED';
        const authErrCode = (authError && typeof authError === 'object' && 'code' in authError) ? String((authError as Record<string, unknown>).code) : authErrStr;

        let humanReason = `${SERVER_I18N.tls.defaultReason[lang] || SERVER_I18N.tls.defaultReason.zh} (${authErrStr})`;
        let suggestion = SERVER_I18N.tls.defaultSuggestion[lang] || SERVER_I18N.tls.defaultSuggestion.zh;

        if (authErrStr.includes('CERT_HAS_EXPIRED') || isExpired) {
          humanReason = `${SERVER_I18N.tls.expiredReason[lang] || SERVER_I18N.tls.expiredReason.zh} [${validTo}]`;
          suggestion = SERVER_I18N.tls.expiredSuggestion[lang] || SERVER_I18N.tls.expiredSuggestion.zh;
        } else if (authErrStr.includes('ALTNAME_INVALID')) {
          humanReason = SERVER_I18N.tls.altnameReason[lang] || SERVER_I18N.tls.altnameReason.zh;
          suggestion = SERVER_I18N.tls.altnameSuggestion[lang] || SERVER_I18N.tls.altnameSuggestion.zh;
        } else if (authErrStr.includes('SELF_SIGNED') || authErrStr.includes('DEPTH_ZERO_SELF_SIGNED_CERT')) {
          humanReason = SERVER_I18N.tls.selfSignedReason[lang] || SERVER_I18N.tls.selfSignedReason.zh;
          suggestion = SERVER_I18N.tls.selfSignedSuggestion[lang] || SERVER_I18N.tls.selfSignedSuggestion.zh;
        }

        resolve({
          success: false,
          timeMs,
          cert: {
            subject,
            issuer,
            validFrom,
            validTo,
            daysRemaining,
            isExpired,
            protocol,
            authorized: false,
          },
          code: authErrCode || 'CERT_UNVERIFIED',
          error: humanReason,
          rawMessage: authErrStr,
          suggestion,
        });
        return;
      }

      resolve({
        success: true,
        timeMs,
        cert: {
          subject,
          issuer,
          validFrom,
          validTo,
          daysRemaining,
          isExpired,
          protocol,
          authorized: true,
        },
      });
    });

    socket.on('timeout', () => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      socket.destroy();
      resolve({
        success: false,
        timeMs,
        code: 'TLS_TIMEOUT',
        error: `${SERVER_I18N.tls.timeoutReason[lang] || SERVER_I18N.tls.timeoutReason.zh} (${timeoutMs}ms)`,
        suggestion: SERVER_I18N.tls.timeoutSuggestion[lang] || SERVER_I18N.tls.timeoutSuggestion.zh,
      });
    });

    socket.on('error', (err: unknown) => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      socket.destroy();
      const errorObj = err as { code?: string; message?: string };
      resolve({
        success: false,
        timeMs,
        code: errorObj.code || 'TLS_ERROR',
        error: `${SERVER_I18N.tls.defaultReason[lang] || SERVER_I18N.tls.defaultReason.zh}: ${errorObj.message || errorObj.code}`,
        rawMessage: errorObj.message || String(err),
        suggestion: SERVER_I18N.tls.defaultSuggestion[lang] || SERVER_I18N.tls.defaultSuggestion.zh,
      });
    });
  });
}

// Stage 4: HTTP Request Probe
function performHttpProbe(target: TargetParsed, timeoutMs: number = 6000, lang: SupportedLang = 'zh'): Promise<{
  success: boolean;
  timeMs: number;
  statusCode?: number;
  statusText?: string;
  server?: string;
  contentType?: string;
  contentLength?: string;
  redirectLocation?: string;
  error?: string;
  code?: string;
  rawMessage?: string;
  suggestion?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const isHttps = target.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Diagnostic Probe; Network Health Checker/1.0)',
        'Accept': '*/*',
        'Connection': 'close',
      },
      timeout: timeoutMs,
      rejectUnauthorized: false,
    };

    let isSettled = false;

    const req = client.request(requestOptions, (res) => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      const statusCode = res.statusCode || 200;
      const statusText = res.statusMessage || '';
      const server = (res.headers['server'] as string) || '';
      const contentType = (res.headers['content-type'] as string) || '';
      const contentLength = (res.headers['content-length'] as string) || '';
      const redirectLocation = (res.headers['location'] as string) || '';

      // Destroy connection early since we only need the response headers
      res.destroy();

      if (statusCode >= 400) {
        let humanReason = `${SERVER_I18N.http.defaultReason[lang] || SERVER_I18N.http.defaultReason.zh}: ${statusCode} ${statusText}`;
        let suggestion = SERVER_I18N.http.defaultSuggestion[lang] || SERVER_I18N.http.defaultSuggestion.zh;

        if (statusCode === 401 || statusCode === 403) {
          humanReason = SERVER_I18N.http.unauthReason[lang] || SERVER_I18N.http.unauthReason.zh;
          suggestion = SERVER_I18N.http.unauthSuggestion[lang] || SERVER_I18N.http.unauthSuggestion.zh;
        } else if (statusCode === 404) {
          humanReason = SERVER_I18N.http.notFoundReason[lang] || SERVER_I18N.http.notFoundReason.zh;
          suggestion = SERVER_I18N.http.notFoundSuggestion[lang] || SERVER_I18N.http.notFoundSuggestion.zh;
        } else if (statusCode === 500) {
          humanReason = SERVER_I18N.http.internalErrorReason[lang] || SERVER_I18N.http.internalErrorReason.zh;
          suggestion = SERVER_I18N.http.internalErrorSuggestion[lang] || SERVER_I18N.http.internalErrorSuggestion.zh;
        } else if (statusCode === 502) {
          humanReason = SERVER_I18N.http.badGatewayReason[lang] || SERVER_I18N.http.badGatewayReason.zh;
          suggestion = SERVER_I18N.http.badGatewaySuggestion[lang] || SERVER_I18N.http.badGatewaySuggestion.zh;
        } else if (statusCode === 503) {
          humanReason = SERVER_I18N.http.unavailableReason[lang] || SERVER_I18N.http.unavailableReason.zh;
          suggestion = SERVER_I18N.http.unavailableSuggestion[lang] || SERVER_I18N.http.unavailableSuggestion.zh;
        } else if (statusCode === 504) {
          humanReason = SERVER_I18N.http.gatewayTimeoutReason[lang] || SERVER_I18N.http.gatewayTimeoutReason.zh;
          suggestion = SERVER_I18N.http.gatewayTimeoutSuggestion[lang] || SERVER_I18N.http.gatewayTimeoutSuggestion.zh;
        }

        resolve({
          success: false,
          timeMs,
          statusCode,
          statusText,
          server,
          contentType,
          contentLength,
          redirectLocation,
          code: `HTTP_${statusCode}`,
          error: humanReason,
          suggestion,
        });
        return;
      }

      resolve({
        success: true,
        timeMs,
        statusCode,
        statusText,
        server,
        contentType,
        contentLength,
        redirectLocation,
      });
    });

    req.on('timeout', () => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      req.destroy();
      resolve({
        success: false,
        timeMs,
        code: 'HTTP_TIMEOUT',
        error: `${SERVER_I18N.http.defaultReason[lang] || SERVER_I18N.http.defaultReason.zh} (${timeoutMs}ms)`,
        suggestion: SERVER_I18N.http.defaultSuggestion[lang] || SERVER_I18N.http.defaultSuggestion.zh,
      });
    });

    req.on('error', (err: unknown) => {
      if (isSettled) return;
      isSettled = true;
      const timeMs = Date.now() - startTime;
      req.destroy();
      const errorObj = err as { code?: string; message?: string };
      resolve({
        success: false,
        timeMs,
        code: errorObj.code || 'HTTP_ERROR',
        error: `${SERVER_I18N.http.defaultReason[lang] || SERVER_I18N.http.defaultReason.zh}: ${errorObj.message || errorObj.code}`,
        rawMessage: errorObj.message || String(err),
        suggestion: SERVER_I18N.http.defaultSuggestion[lang] || SERVER_I18N.http.defaultSuggestion.zh,
      });
    });

    req.end();
  });
}

// Orchestrator for full diagnosis on a single target
async function diagnoseSingleTarget(rawInput: string, customDns?: string, timeoutMs: number = 6000, lang: SupportedLang = 'zh') {
  const target = parseTarget(rawInput);
  const startTime = Date.now();

  const stepNameDns = SERVER_I18N.dns.name[lang] || SERVER_I18N.dns.name.zh;
  const stepNameTcp = SERVER_I18N.tcp.name[lang] || SERVER_I18N.tcp.name.zh;
  const stepNameTls = SERVER_I18N.tls.name[lang] || SERVER_I18N.tls.name.zh;
  const stepNameHttp = SERVER_I18N.http.name[lang] || SERVER_I18N.http.name.zh;

  const result = {
    id: `chk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    inputUrl: rawInput,
    hostname: target.hostname,
    protocol: target.protocol.replace(':', ''),
    port: target.port,
    timestamp: Date.now(),
    status: 'idle' as 'idle' | 'running' | 'ok' | 'warning' | 'error',
    summary: '',
    errorCategory: undefined as 'DNS' | 'TCP' | 'TLS' | 'HTTP' | 'TIMEOUT' | 'UNKNOWN' | undefined,
    errorReason: undefined as string | undefined,
    solutionSuggestion: undefined as string | undefined,
    rawError: undefined as string | undefined,
    totalTimeMs: 0,
    steps: {
      dns: {
        name: stepNameDns,
        status: 'pending' as StepStatus,
        timeMs: 0,
      } as StepObj,
      tcp: {
        name: stepNameTcp,
        status: 'pending' as StepStatus,
        timeMs: 0,
      } as StepObj,
      tls: {
        name: stepNameTls,
        status: 'pending' as StepStatus,
        timeMs: 0,
      } as StepObj,
      http: {
        name: stepNameHttp,
        status: 'pending' as StepStatus,
        timeMs: 0,
      } as StepObj,
    },
    dnsRecords: undefined as { a?: string[]; aaaa?: string[]; cname?: string[] } | undefined,
    resolvedIp: undefined as string | undefined,
    certDetails: undefined as Record<string, unknown> | undefined,
    httpDetails: undefined as Record<string, unknown> | undefined,
  };

  // Step 1: DNS
  result.steps.dns.status = 'running';
  const dnsRes = await performDnsCheck(target.hostname, customDns, Math.min(timeoutMs, 4000), lang);
  result.steps.dns.timeMs = dnsRes.timeMs;

  if (!dnsRes.success) {
    result.steps.dns.status = 'failed';
    (result.steps.dns as unknown as { error: string }).error = dnsRes.error;
    result.steps.tcp.status = 'skipped';
    result.steps.tls.status = 'skipped';
    result.steps.http.status = 'skipped';

    result.status = 'error';
    result.errorCategory = 'DNS';
    const failTemplate = SERVER_I18N.summary.dnsFailed[lang] || SERVER_I18N.summary.dnsFailed.zh;
    result.summary = failTemplate.replace('{reason}', dnsRes.error || '');
    result.errorReason = dnsRes.error;
    result.solutionSuggestion = dnsRes.suggestion;
    result.rawError = dnsRes.rawMessage;
    result.totalTimeMs = Date.now() - startTime;
    return result;
  }

  result.steps.dns.status = 'success';
  result.dnsRecords = dnsRes.records;
  result.resolvedIp = dnsRes.resolvedIp;

  // Step 2: TCP
  result.steps.tcp.status = 'running';
  const tcpHost = dnsRes.resolvedIp || target.hostname;
  const tcpRes = await performTcpCheck(tcpHost, target.port, Math.min(timeoutMs, 4000), lang);
  result.steps.tcp.timeMs = tcpRes.timeMs;

  if (!tcpRes.success) {
    result.steps.tcp.status = 'failed';
    (result.steps.tcp as unknown as { error: string }).error = tcpRes.error;
    result.steps.tls.status = 'skipped';
    result.steps.http.status = 'skipped';

    result.status = 'error';
    result.errorCategory = tcpRes.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'TCP';
    const failTemplate = SERVER_I18N.summary.tcpFailed[lang] || SERVER_I18N.summary.tcpFailed.zh;
    result.summary = failTemplate.replace('{reason}', tcpRes.error || '');
    result.errorReason = tcpRes.error;
    result.solutionSuggestion = tcpRes.suggestion;
    result.rawError = tcpRes.rawMessage;
    result.totalTimeMs = Date.now() - startTime;
    return result;
  }
  result.steps.tcp.status = 'success';

  // Step 3: TLS (only for HTTPS or port 443)
  if (target.protocol === 'https:' || target.port === 443) {
    result.steps.tls.status = 'running';
    const tlsRes = await performTlsCheck(target.hostname, target.port, Math.min(timeoutMs, 4000), lang);
    result.steps.tls.timeMs = tlsRes.timeMs;
    result.certDetails = tlsRes.cert;

    if (!tlsRes.success) {
      result.steps.tls.status = 'failed';
      (result.steps.tls as unknown as { error: string }).error = tlsRes.error;
      result.steps.http.status = 'skipped';

      result.status = 'error';
      result.errorCategory = 'TLS';
      const failTemplate = SERVER_I18N.summary.tlsFailed[lang] || SERVER_I18N.summary.tlsFailed.zh;
      result.summary = failTemplate.replace('{reason}', tlsRes.error || '');
      result.errorReason = tlsRes.error;
      result.solutionSuggestion = tlsRes.suggestion;
      result.rawError = tlsRes.rawMessage;
      result.totalTimeMs = Date.now() - startTime;
      return result;
    }
    result.steps.tls.status = 'success';
  } else {
    result.steps.tls.status = 'skipped';
  }

  // Step 4: HTTP
  result.steps.http.status = 'running';
  const httpRes = await performHttpProbe(target, timeoutMs, lang);
  result.steps.http.timeMs = httpRes.timeMs;
  result.httpDetails = {
    statusCode: httpRes.statusCode,
    statusText: httpRes.statusText,
    server: httpRes.server,
    contentType: httpRes.contentType,
    contentLength: httpRes.contentLength,
    redirectLocation: httpRes.redirectLocation,
  };

  if (!httpRes.success) {
    result.steps.http.status = 'failed';
    (result.steps.http as unknown as { error: string }).error = httpRes.error;

    // If HTTP error (e.g. 500, 502) but DNS and TCP passed, status is warning/error
    result.status = httpRes.statusCode && httpRes.statusCode < 500 ? 'warning' : 'error';
    result.errorCategory = 'HTTP';
    const failTemplate = SERVER_I18N.summary.httpFailed[lang] || SERVER_I18N.summary.httpFailed.zh;
    result.summary = failTemplate.replace('{reason}', httpRes.error || '');
    result.errorReason = httpRes.error;
    result.solutionSuggestion = httpRes.suggestion;
    result.rawError = httpRes.rawMessage;
    result.totalTimeMs = Date.now() - startTime;
    return result;
  }

  result.steps.http.status = 'success';
  result.status = 'ok';
  result.totalTimeMs = Date.now() - startTime;
  const okTemplate = SERVER_I18N.summary.ok[lang] || SERVER_I18N.summary.ok.zh;
  result.summary = okTemplate
    .replace('{ip}', result.resolvedIp || target.hostname)
    .replace('{time}', String(result.totalTimeMs));

  return result;
}

// API endpoint: Batch check
app.post('/api/check', async (req, res) => {
  try {
    const { targets, customDns, timeoutMs, lang = 'zh' } = req.body;
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      const errMsg = lang === 'en' ? 'Please provide targets array' : lang === 'ar' ? 'يرجى تقديم قائمة العناوين (targets)' : '请提供需要检测的地址列表 (targets 数组)';
      return res.status(400).json({ error: errMsg });
    }

    const validLang: SupportedLang = lang === 'en' || lang === 'ar' ? lang : 'zh';

    // Limit to max 30 targets per batch to prevent denial of service
    const cleanTargets = targets
      .map((t: unknown) => (typeof t === 'string' ? t.trim() : ''))
      .filter((t: string) => t.length > 0)
      .slice(0, 30);

    const timeout = typeof timeoutMs === 'number' && timeoutMs >= 1000 && timeoutMs <= 15000
      ? timeoutMs
      : 6000;

    const dnsServer = typeof customDns === 'string' && customDns.trim() ? customDns.trim() : undefined;

    // Run parallel checks with concurrency limit
    const results = await Promise.all(
      cleanTargets.map((t) => diagnoseSingleTarget(t, dnsServer, timeout, validLang))
    );

    return res.json({
      success: true,
      timestamp: Date.now(),
      count: results.length,
      results,
    });
  } catch (err: unknown) {
    console.error('Batch check error:', err);
    return res.status(500).json({
      error: '诊断服务执行异常',
      details: String(err),
    });
  }
});

// API endpoint: Single check
app.post('/api/check-one', async (req, res) => {
  try {
    const { target, customDns, timeoutMs, lang = 'zh' } = req.body;
    if (!target || typeof target !== 'string' || !target.trim()) {
      const errMsg = lang === 'en' ? 'Please provide a target address' : lang === 'ar' ? 'يرجى تحديد عنوان الهدف' : '请提供需要检测的目标地址';
      return res.status(400).json({ error: errMsg });
    }

    const validLang: SupportedLang = lang === 'en' || lang === 'ar' ? lang : 'zh';
    const timeout = typeof timeoutMs === 'number' && timeoutMs >= 1000 && timeoutMs <= 15000
      ? timeoutMs
      : 6000;
    const dnsServer = typeof customDns === 'string' && customDns.trim() ? customDns.trim() : undefined;

    const result = await diagnoseSingleTarget(target.trim(), dnsServer, timeout, validLang);
    return res.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    console.error('Single check error:', err);
    return res.status(500).json({
      error: '单个目标诊断异常',
      details: String(err),
    });
  }
});

// Local reports storage directory
const REPORTS_DIR = process.env.REPORTS_DIR || path.join(process.cwd(), 'data', 'reports');

async function ensureReportsDir() {
  try {
    await fs.promises.mkdir(REPORTS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create reports directory:', err);
  }
}
ensureReportsDir();

/**
 * Extract client IP from headers or socket, handling multiple reverse proxy hops
 */
function extractClientIp(req: express.Request): string {
  // Helper to clean IP address: strip IPv6 prefix, brackets, or trailing port (e.g. "1.2.3.4:5678" or "[2001:db8::1]:8080")
  const cleanIp = (raw: string): string => {
    let s = raw.trim();
    if (!s) return '';
    // Strip ::ffff: if IPv4-mapped IPv6
    s = s.replace(/^::ffff:/, '');
    // If [IPv6]:port format
    const ipv6Bracket = s.match(/^\[([^\]]+)\](?::\d+)?$/);
    if (ipv6Bracket) return ipv6Bracket[1];
    // If standard IPv4:port
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(s)) {
      return s.split(':')[0];
    }
    return s;
  };

  const candidates: string[] = [];

  // 1. Cloudflare headers
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
    candidates.push(cleanIp(cfConnectingIp));
  }

  // 2. True-Client-IP (Cloudflare Enterprise / Akamai / Fastly)
  const trueClientIp = req.headers['true-client-ip'];
  if (typeof trueClientIp === 'string' && trueClientIp.trim()) {
    candidates.push(cleanIp(trueClientIp));
  }

  // 3. X-Real-IP (standard Nginx / ingress proxy)
  const xRealIp = req.headers['x-real-ip'];
  if (typeof xRealIp === 'string' && xRealIp.trim()) {
    candidates.push(cleanIp(xRealIp));
  }

  // 4. X-Forwarded-For (can contain a comma-separated list of client, proxy1, proxy2...)
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
    const rawIps = xForwardedFor.split(',').map((s) => cleanIp(s)).filter(Boolean);
    candidates.push(...rawIps);
  } else if (Array.isArray(xForwardedFor)) {
    for (const item of xForwardedFor) {
      if (typeof item === 'string') {
        const rawIps = item.split(',').map((s) => cleanIp(s)).filter(Boolean);
        candidates.push(...rawIps);
      }
    }
  }

  // 5. Express req.ip (populated when trust proxy is true)
  if (req.ip && typeof req.ip === 'string') {
    candidates.push(cleanIp(req.ip));
  }

  // 6. Direct TCP socket address
  const remote = req.socket.remoteAddress || '';
  if (remote) {
    candidates.push(cleanIp(remote));
  }

  // Filter valid IP candidates
  const validCandidates = candidates.filter((ip) => ip && ip !== 'unknown');

  // If there are public IPs, prioritize the first public non-loopback IP
  const nonPrivateIp = validCandidates.find((ip) => !isPrivateOrLocalIp(ip));
  if (nonPrivateIp) {
    return nonPrivateIp;
  }

  // Fallback to first candidate or 127.0.0.1
  return validCandidates[0] || '127.0.0.1';
}

/**
 * Check whether IP is private/local/loopback
 */
function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)) return true;
  if (ip.startsWith('169.254.')) return true; // link-local
  if (ip.startsWith('fc00:') || ip.startsWith('fd00:') || ip.startsWith('fe80:')) return true;
  return false;
}

/**
 * Query GeoIP information for client IP with timeout and multiple fallbacks
 */
async function resolveClientGeoInfo(clientIp: string): Promise<{
  country?: string;
  countryCode?: string;
  region?: string;
  city?: string;
}> {
  if (!clientIp || isPrivateOrLocalIp(clientIp)) {
    return {
      country: '局域网/本地回环 (LAN / Local)',
      countryCode: 'LAN',
    };
  }

  // 1. Try ip-api.com (free, high accuracy, no key required)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(clientIp)}?fields=status,country,countryCode,regionName,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as {
        status?: string;
        country?: string;
        countryCode?: string;
        regionName?: string;
        city?: string;
      };
      if (data.status === 'success' && data.country) {
        return {
          country: data.country,
          countryCode: data.countryCode,
          region: data.regionName,
          city: data.city,
        };
      }
    }
  } catch {
    // ignore and try fallback
  }

  // 2. Fallback: country.is (fast and minimal)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.country.is/${encodeURIComponent(clientIp)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as { country?: string };
      if (data.country) {
        return {
          country: data.country,
          countryCode: data.country,
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    country: '未知归属地',
    countryCode: 'UNKNOWN',
  };
}

// API endpoint: Upload and save diagnostic report to local file
app.post('/api/reports', async (req, res) => {
  try {
    await ensureReportsDir();
    const { results, targets, customDns, timeoutMs, title, clientInfo } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({ error: 'Missing or empty results array' });
    }

    // Resolve client IP and Geolocation
    const detectedIp = extractClientIp(req);
    // Cloudflare geolocation header check
    const cfCountry = req.headers['cf-ipcountry'];
    let geo = await resolveClientGeoInfo(detectedIp);
    if (typeof cfCountry === 'string' && cfCountry.trim() && cfCountry.length === 2) {
      geo = {
        ...geo,
        countryCode: cfCountry.toUpperCase(),
        country: geo.country || cfCountry.toUpperCase(),
      };
    }

    // Generate unique ID: e.g. rep_m7x2ab_4f81c9
    const uniqueId = `rep_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    const filePath = path.join(REPORTS_DIR, `${uniqueId}.json`);

    const total = results.length;
    const okCount = results.filter((r: { status: string }) => r.status === 'ok').length;
    const failedCount = results.filter((r: { status: string }) => r.status !== 'ok').length;
    const validTimes = results
      .filter((r: { totalTimeMs?: number }) => typeof r.totalTimeMs === 'number' && r.totalTimeMs > 0)
      .map((r: { totalTimeMs: number }) => r.totalTimeMs);
    const avgTimeMs = validTimes.length > 0
      ? Math.round(validTimes.reduce((a: number, b: number) => a + b, 0) / validTimes.length)
      : 0;

    const finalClientInfo = {
      userAgent: String(req.headers['user-agent'] || (clientInfo && clientInfo.userAgent) || ''),
      ip: detectedIp,
      country: geo.country || '未知国家',
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
    };

    const reportData = {
      id: uniqueId,
      createdAt: Date.now(),
      title: title || 'Network Diagnostic Report',
      targets: Array.isArray(targets) && targets.length > 0
        ? targets
        : results.map((r: { inputUrl?: string; hostname?: string }) => r.inputUrl || r.hostname || ''),
      customDns: typeof customDns === 'string' ? customDns.trim() : undefined,
      timeoutMs: typeof timeoutMs === 'number' ? timeoutMs : 5000,
      total,
      okCount,
      failedCount,
      avgTimeMs,
      results,
      clientInfo: finalClientInfo,
    };

    await fs.promises.writeFile(filePath, JSON.stringify(reportData, null, 2), 'utf-8');

    return res.status(201).json({
      success: true,
      id: uniqueId,
      createdAt: reportData.createdAt,
      viewUrl: `/?reportId=${uniqueId}`,
      message: 'Report uploaded and saved successfully',
      clientInfo: finalClientInfo,
    });
  } catch (err: unknown) {
    console.error('Error saving report:', err);
    return res.status(500).json({
      error: 'Failed to save diagnostic report',
      details: String(err),
    });
  }
});

// API endpoint: Retrieve a saved diagnostic report by unique ID
app.get('/api/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !/^[a-zA-Z0-9_-]{4,64}$/.test(id)) {
      return res.status(400).json({ error: 'Invalid report ID format' });
    }

    const filePath = path.join(REPORTS_DIR, `${id}.json`);
    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch {
      return res.status(404).json({ error: 'Report not found' });
    }

    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const report = JSON.parse(fileContent);

    return res.json({
      success: true,
      report,
    });
  } catch (err: unknown) {
    console.error('Error fetching report:', err);
    return res.status(500).json({
      error: 'Failed to retrieve report',
      details: String(err),
    });
  }
});

// API endpoint: List recently saved reports
app.get('/api/reports', async (req, res) => {
  try {
    await ensureReportsDir();
    const files = await fs.promises.readdir(REPORTS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const summaries = await Promise.all(
      jsonFiles.map(async (filename) => {
        try {
          const filePath = path.join(REPORTS_DIR, filename);
          const raw = await fs.promises.readFile(filePath, 'utf-8');
          const data = JSON.parse(raw);
          return {
            id: data.id || filename.replace('.json', ''),
            createdAt: data.createdAt || 0,
            targets: data.targets || [],
            total: data.total || (data.results ? data.results.length : 0),
            okCount: data.okCount ?? 0,
            failedCount: data.failedCount ?? 0,
            avgTimeMs: data.avgTimeMs ?? 0,
            clientInfo: data.clientInfo ? {
              ip: data.clientInfo.ip,
              country: data.clientInfo.country,
              region: data.clientInfo.region,
            } : undefined,
          };
        } catch {
          return null;
        }
      })
    );

    const validSummaries = summaries
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);

    return res.json({
      success: true,
      count: validSummaries.length,
      reports: validSummaries,
    });
  } catch (err: unknown) {
    console.error('Error listing reports:', err);
    return res.status(500).json({
      error: 'Failed to list reports',
      details: String(err),
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Debug endpoint: inspect resolved client IP and proxy headers
app.get('/api/my-ip', (req, res) => {
  const detectedIp = extractClientIp(req);
  res.json({
    detectedIp,
    isPrivateOrLocal: isPrivateOrLocalIp(detectedIp),
    headers: {
      'cf-connecting-ip': req.headers['cf-connecting-ip'] || null,
      'true-client-ip': req.headers['true-client-ip'] || null,
      'x-real-ip': req.headers['x-real-ip'] || null,
      'x-forwarded-for': req.headers['x-forwarded-for'] || null,
      'x-forwarded-proto': req.headers['x-forwarded-proto'] || null,
      host: req.headers.host || null,
    },
    expressReqIp: req.ip,
    socketRemoteAddress: req.socket.remoteAddress,
  });
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DNS & Connectivity Checker Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
