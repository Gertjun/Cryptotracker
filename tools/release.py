#!/usr/bin/env python3
"""Nieuwe versie uitbrengen.

Gebruik (vanuit de hoofdmap van de repository):
    python3 tools/release.py <major|minor|patch> <changelog-tekst.md>

- MAJOR: je moet iets doen (opnieuw koppelen, alle apparaten bijwerken, opnieuw installeren)
- MINOR: nieuwe functie
- PATCH: kleine verbetering of foutoplossing

Het script verhoogt APP_VERSION in app.js, version in js/config.js en de cache-naam in sw.js,
en zet de changelog-tekst bovenaan CHANGELOG.md (met de datum van vandaag). Er wordt geen zip
meer gemaakt: wijzigingen gaan via een pull request (D64).
"""
import sys,re,subprocess,datetime,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kind=sys.argv[1];body=open(sys.argv[2],encoding='utf-8').read().strip()
assert kind in ('major','minor','patch'),kind
app=open(f'{root}/app.js',encoding='utf-8').read()
M,m,P=map(int,re.search(r"const APP_VERSION='(\d+)\.(\d+)\.(\d+) ",app).groups())
if kind=='major':M,m,P=M+1,0,0
elif kind=='minor':m,P=m+1,0
else:P+=1
v=f'{M}.{m}.{P}';d=datetime.date.today()
mk=["jan","feb","mrt","apr","mei","jun","jul","aug","sep","okt","nov","dec"][d.month-1]
ml=["januari","februari","maart","april","mei","juni","juli","augustus","september","oktober","november","december"][d.month-1]
open(f'{root}/app.js','w',encoding='utf-8').write(re.sub(r"const APP_VERSION='[^']*'",f"const APP_VERSION='{v} ({d.day} {mk} {d.year})'",app))
cfg=open(f'{root}/js/config.js',encoding='utf-8').read()
cfg2=re.sub(r"(\bversion:\s*')[^']*(')",lambda m:m.group(1)+v+m.group(2),cfg,count=1)
assert cfg2!=cfg or f"version: '{v}'" in cfg,'version in js/config.js niet gevonden'
open(f'{root}/js/config.js','w',encoding='utf-8').write(cfg2)
sw=open(f'{root}/sw.js',encoding='utf-8').read();open(f'{root}/sw.js','w',encoding='utf-8').write(re.sub(r"crypto-portfolio-[v0-9.]+",f"crypto-portfolio-{v}",sw))
cl=open(f'{root}/CHANGELOG.md',encoding='utf-8').read()
cl=re.sub(r"`crypto-portfolio-[0-9.]+`",f"`crypto-portfolio-{v}`",cl);cl=re.sub(r"`crypto-tracker-[0-9.]+\.zip`",f"`crypto-tracker-{v}.zip`",cl)
i=cl.index('\n## ')
cl=cl[:i]+f'\n## {v} – {d.day} {ml} {d.year}\n{body}\n'+cl[i:]
open(f'{root}/CHANGELOG.md','w',encoding='utf-8').write(cl)
print('OK',v)
