# Velza Global Regional Routing

## Structure
- regions/hk/ = Hong Kong / HQ master website
- regions/ph/ = Philippines website
- regions/in/ = India website
- region/ = shared region preference configuration/switcher

## Required production behavior
IN -> India
PH -> Philippines
HK -> Hong Kong
Other -> Hong Kong fallback

The public URL remains https://velzaglobal.com/. Use internal server/CDN routing, not domain redirects.
