#!/usr/bin/env python3
"""Een punt van de roadmap halen als het is ingebouwd of afgerond.

Gebruik (vanuit de hoofdmap): python3 tools/wish.py W3
Verwijdert het blok '### W3 – …' uit ROADMAP.md (en een groep die daardoor leeg is).
Zet in de changelog bij die versie "(wens W3)".
"""
import sys,re,os
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p=f'{root}/ROADMAP.md';s=open(p,encoding='utf-8').read();w=sys.argv[1]
m=re.search(r'\n### '+re.escape(w)+r' – .*?(?=\n### |\n## |\n---)',s,re.S);assert m,f'{w} niet gevonden'
s=s[:m.start()]+s[m.end():]
s=re.sub(r'\n## [^\n]+\n(?=\n## |\n---)','\n',s)   # lege groep weghalen
open(p,'w',encoding='utf-8').write(s);print('verwijderd',w)
