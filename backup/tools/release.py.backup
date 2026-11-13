#!/usr/bin/env python3
"""Nieuwe versie uitbrengen.

Gebruik (vanuit de hoofdmap van de repository):
    python3 tools/release.py <major|minor|patch> <changelog-tekst.md> [uitvoermap]

- MAJOR: je moet iets doen (opnieuw koppelen, alle apparaten bijwerken, opnieuw installeren)
- MINOR: nieuwe functie
- PATCH: kleine verbetering of foutoplossing

Het script verhoogt APP_VERSION in app.js en de cache-naam in sw.js, zet de changelog-tekst
bovenaan CHANGELOG.md (met de datum van vandaag) en maakt crypto-tracker-X.Y.Z.zip in de
uitvoermap (standaard: ../releases). De zip bevat de map 'crypto-tracker' zonder node_modules
en testresultaten.
"""
import sys,re,subprocess,datetime,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
kind=sys.argv[1];body=open(sys.argv[2],encoding='utf-8').read().strip()
out=os.path.abspath(sys.argv[3]) if len(sys.argv)>3 else os.path.join(os.path.dirname(root),'releases')
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
sw=open(f'{root}/sw.js',encoding='utf-8').read();open(f'{root}/sw.js','w',encoding='utf-8').write(re.sub(r"crypto-portfolio-[v0-9.]+",f"crypto-portfolio-{v}",sw))
cl=open(f'{root}/CHANGELOG.md',encoding='utf-8').read()
cl=re.sub(r"`crypto-portfolio-[0-9.]+`",f"`crypto-portfolio-{v}`",cl);cl=re.sub(r"`crypto-tracker-[0-9.]+\.zip`",f"`crypto-tracker-{v}.zip`",cl)
i=cl.index('\n## ')
cl=cl[:i]+f'\n## {v} – {d.day} {ml} {d.year}\n{body}\n'+cl[i:]
open(f'{root}/CHANGELOG.md','w',encoding='utf-8').write(cl)
os.makedirs(out,exist_ok=True);z=os.path.join(out,f'crypto-tracker-{v}.zip')
if os.path.exists(z):os.remove(z)
name=os.path.basename(root)
subprocess.run(['zip','-qr',z,name,'-x',f'{name}/tests/node_modules/*',f'{name}/tests/test-results/*',f'{name}/tests/playwright-report/*',f'{name}/.git/*'],cwd=os.path.dirname(root),check=True)
print('OK',v,z)
