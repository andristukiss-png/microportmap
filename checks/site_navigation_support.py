"""Remove only the explicitly requested shared navigation additions for baseline checks."""
import re
CSS_LINK='<link rel="stylesheet" href="/site-navigation.css" data-mp-site-navigation="1">'
def without_site_navigation(text):
 text=text.replace(CSS_LINK,'')
 for part in ['content','rail','skip']:
  text=re.sub(r'<!-- mp-site-navigation:'+part+r':start -->.*?<!-- mp-site-navigation:'+part+r':end -->','',text,flags=re.S)
 return text
