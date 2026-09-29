"""Run unchanged category assertions with additional navigation diagnostics."""
import os,pathlib,runpy
from playwright.sync_api import BrowserContext
from navigation_probe import instrument

out=pathlib.Path(os.getenv('WORD_OUT','qa/word'));out.mkdir(parents=True,exist_ok=True)
original=BrowserContext.new_page
dumps=[]
def new_page(self,*args,**kwargs):
    page=original(self,*args,**kwargs)
    dumps.append(instrument(page,out))
    return page
BrowserContext.new_page=new_page
try:
    runpy.run_path(str(pathlib.Path(__file__).with_name('categories_browser.py')),run_name='__main__')
finally:
    if dumps:dumps[-1]()
    BrowserContext.new_page=original
