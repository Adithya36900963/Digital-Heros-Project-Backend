import { LoginHistory } from '../models/LoginHistory.js';

function normalizeIp(ip) {
  if (!ip) return '';
  if (ip === '::1') return '127.0.0.1';
  if (ip.startsWith('::ffff:')) return ip.slice(7);
  return ip;
}

function extractIpAddress(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const firstForwarded = forwarded?.split(',')[0]?.trim();

  return {
    ipAddress: normalizeIp(firstForwarded || req.ip || req.socket?.remoteAddress || ''),
    forwardedFor: forwarded || ''
  };
}

function detectBrowser(userAgent) {
  const patterns = [
    { name: 'Edge', regex: /edg\/([\d.]+)/i },
    { name: 'Opera', regex: /opr\/([\d.]+)/i },
    { name: 'Samsung Internet', regex: /samsungbrowser\/([\d.]+)/i },
    { name: 'Chrome', regex: /(chrome|crios)\/([\d.]+)/i, versionGroup: 2 },
    { name: 'Firefox', regex: /(firefox|fxios)\/([\d.]+)/i, versionGroup: 2 },
    { name: 'Safari', regex: /version\/([\d.]+).*safari/i },
    { name: 'Internet Explorer', regex: /(?:msie |rv:)([\d.]+)/i }
  ];

  for (const pattern of patterns) {
    const match = userAgent.match(pattern.regex);
    if (match) {
      return {
        browser: pattern.name,
        browserVersion: match[pattern.versionGroup || 1] || ''
      };
    }
  }

  return { browser: 'Unknown', browserVersion: '' };
}

function detectOperatingSystem(userAgent) {
  if (/windows nt/i.test(userAgent)) return 'Windows';
  if (/android/i.test(userAgent)) return 'Android';
  if (/(iphone|ipad|ipod)/i.test(userAgent)) return 'iOS';
  if (/mac os x|macintosh/i.test(userAgent)) return 'macOS';
  if (/cros/i.test(userAgent)) return 'Chrome OS';
  if (/linux/i.test(userAgent)) return 'Linux';
  return 'Unknown';
}

function detectDeviceType(userAgent) {
  if (/bot|crawler|spider|slurp/i.test(userAgent)) return 'bot';
  if (/ipad|tablet|kindle|playbook|sm-t/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|ipod|android/i.test(userAgent)) return 'mobile';
  if (userAgent) return 'desktop';
  return 'unknown';
}

function detectDeviceName(userAgent, operatingSystem, deviceType) {
  if (/iphone/i.test(userAgent)) return 'iPhone';
  if (/ipad/i.test(userAgent)) return 'iPad';
  if (/pixel/i.test(userAgent)) return 'Google Pixel';
  if (/samsung|sm-/i.test(userAgent)) return 'Samsung Device';
  if (/redmi/i.test(userAgent)) return 'Redmi Device';
  if (/oneplus/i.test(userAgent)) return 'OnePlus Device';
  if (/macintosh|mac os x/i.test(userAgent)) return 'Mac';
  if (/windows/i.test(userAgent)) return 'Windows PC';
  if (/android/i.test(userAgent)) return 'Android Device';
  if (deviceType === 'tablet') return `${operatingSystem} Tablet`.trim();
  if (deviceType === 'mobile') return `${operatingSystem} Mobile`.trim();
  if (deviceType === 'desktop') return `${operatingSystem} Desktop`.trim();
  return 'Unknown Device';
}

export function parseClientMetadata(req) {
  const userAgent = String(req.get('user-agent') || '').trim();
  const operatingSystem = detectOperatingSystem(userAgent);
  const deviceType = detectDeviceType(userAgent);
  const { browser, browserVersion } = detectBrowser(userAgent);
  const { ipAddress, forwardedFor } = extractIpAddress(req);

  return {
    ipAddress,
    forwardedFor,
    userAgent,
    browser,
    browserVersion,
    operatingSystem,
    deviceType,
    deviceName: detectDeviceName(userAgent, operatingSystem, deviceType)
  };
}

export async function recordSuccessfulLogin({ req, user, source = 'password' }) {
  const metadata = parseClientMetadata(req);

  return LoginHistory.create({
    user: user._id,
    userName: user.name,
    userEmail: user.email,
    source,
    ...metadata,
    loginAt: new Date()
  });
}
