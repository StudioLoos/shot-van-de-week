"""Shot van de Week – beheer-client voor de Apps Script web-app.

Sleutel via omgevingsvariabele SVDW_ADMIN_KEY.
  python3 svdw_beheer.py actie '{"ronde": 5}'            # willekeurige actie
  python3 svdw_beheer.py upload <lokaal_bestand> <pad_in_repo>
"""
import base64, json, os, sys, urllib.request, urllib.error

API = 'https://script.google.com/macros/s/AKfycbzG2daH_46YeFEmePyuqTyXGcax8zFrBi5XA5hhUDE5OIRYIGJLkG6NI1bWjsh4kEOe/exec'


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def beheer(actie, **velden):
    body = dict(velden, beheer=True, sleutel=os.environ['SVDW_ADMIN_KEY'], actie=actie)
    req = urllib.request.Request(API, data=json.dumps(body).encode(), method='POST',
                                 headers={'Content-Type': 'text/plain;charset=utf-8'})
    opener = urllib.request.build_opener(_NoRedirect)
    try:
        r = opener.open(req, timeout=120)
        return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303):
            with urllib.request.urlopen(e.headers['Location'], timeout=120) as r2:
                return json.loads(r2.read())
        raise


def upload(lokaal, pad, bericht=None):
    with open(lokaal, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()
    return beheer('upload', pad=pad, base64=b64, bericht=bericht or ('Upload ' + pad))


if __name__ == '__main__':
    if sys.argv[1] == 'upload':
        print(json.dumps(upload(sys.argv[2], sys.argv[3]), ensure_ascii=False))
    else:
        extra = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        print(json.dumps(beheer(sys.argv[1], **extra), ensure_ascii=False))
