// The visitor's region exactly as .htaccess section 9 chooses it, for code that runs in front of the
// origin (the Cloudflare Worker). Keep in step with .htaccess section 9 - both encode the same contract;
// the integration tests parse section 9 from the real .htaccess and fail if they diverge.
//   9a  ?_r=in, then ?_r=ph, then ?_r=hk  (raw query string, case-insensitive; first matching RULE wins)
//   9b  CF-IPCountry request header IN -> in, PH -> ph
//   9c  anything else -> hk

const QUERY_RULES = [
  ['in', /(?:^|&)_r=in(?:&|$)/i],
  ['ph', /(?:^|&)_r=ph(?:&|$)/i],
  ['hk', /(?:^|&)_r=hk(?:&|$)/i],
];
const COUNTRY_RULES = [
  ['in', /^IN$/i],
  ['ph', /^PH$/i],
];
const FALLBACK_REGION = 'hk';

/** Region code ('hk' | 'in' | 'ph') for a Request, as the origin's .htaccess would choose it. */
export const regionFor = (request) => {
  const query = new URL(request.url).search.slice(1);
  for (const [region, rule] of QUERY_RULES) if (rule.test(query)) return region;
  const country = request.headers.get('CF-IPCountry') || '';
  for (const [region, rule] of COUNTRY_RULES) if (rule.test(country)) return region;
  return FALLBACK_REGION;
};
