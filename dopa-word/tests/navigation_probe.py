"""Supplemental diagnostics attached by the category suite; records network events
without inspecting or exporting any real user's data (suite uses synthetic data)."""
import json,pathlib,time

def instrument(page,out):
    requests={};events=[]
    page.on('request',lambda r:requests.update({id(r):{'url':r.url,'type':r.resource_type,'at':time.time()}}))
    def finish(r):
        x=requests.pop(id(r),None)
        if x:events.append({**x,'finished':True,'at_end':time.time()})
    page.on('requestfinished',finish)
    page.on('requestfailed',lambda r:events.append({'url':r.url,'failed':r.failure,'type':r.resource_type}))
    page.on('domcontentloaded',lambda:events.append({'event':'domcontentloaded','url':page.url}))
    return lambda:pathlib.Path(out,'navigation-probe.json').write_text(json.dumps({'pending':list(requests.values()),'recent_events':events[-100:]},ensure_ascii=False,indent=2),encoding='utf8')
