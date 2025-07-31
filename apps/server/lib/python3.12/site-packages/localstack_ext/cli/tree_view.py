_A=None
import curses,functools,json,logging,os
from abc import ABC
from curses import wrapper
from typing import Any,Dict
from localstack.utils.objects import SubtypesInstanceManager
ESC=27
INDENTATION=2
class TreeRenderer(SubtypesInstanceManager,ABC):
	def render_tree(A,tree):raise NotImplementedError
class TreeRendererRich(TreeRenderer):
	@staticmethod
	def impl_name():return'rich'
	def render_tree(C,tree):
		from rich import print;from rich.tree import Tree as A
		def F(obj,parent):
			C=parent;B=obj
			if isinstance(B,list):
				for(H,I)in enumerate(B):E=A(str(H));C.add(F(I,E))
				return C
			elif isinstance(B,dict):
				for(G,D)in B.items():
					if isinstance(D,(dict,list)):
						if not D:return A(f"{G} = {D}")
						E=A(str(G));F(D,E);C.add(E)
					else:C.add(A(f"{G} = {D}"))
				return C
			return A(str(B))
		B=A('Cloud Pod Contents');F(tree,B);print(B)
class Tree:
	def __init__(A,name,obj):A.name=name;A.object=obj;A.expanded=True
	def render(A,depth,width):return A.pad(f"{' '*INDENTATION*depth}{A.icon()} {A.name}",width)
	@functools.lru_cache(maxsize=_A)
	def children(self):
		A=self
		def B(key,value):
			B=value;A=key
			if isinstance(B,(list,dict)):return A
			return f"{B}"if isinstance(A,int)else f"{A} = {B}"
		if isinstance(A.object,dict):return[Tree(B(C,A),A)for(C,A)in A.object.items()]
		if isinstance(A.object,list):return[Tree(B(C,A),A)for(C,A)in enumerate(A.object)]
		return[]
	def icon(A):
		if A.children()and not A.expanded:return'+'
		return'-'
	def expand(A):A.expanded=True
	def collapse(A):A.expanded=False
	def toggle(A):A.expanded=not A.expanded
	def traverse(A):
		yield(A,0)
		if not A.expanded:return
		for B in A.children():
			for(C,D)in B.traverse():yield(C,D+1)
	def pad(A,data,width):return data+' '*(width-len(data))
class TreeRendererCurses(TreeRenderer):
	LOG=_A
	@staticmethod
	def impl_name():return'curses'
	def render_tree(B,dict_obj):
		A=os.dup(0),os.dup(1)
		def C(_tree):
			def A(win):return B.curses_main(win,_tree)
			return A
		try:A=B.open_tty();D=Tree('Cloud Pod Content',dict_obj);wrapper(C(D))
		finally:os.close(0);os.close(1);os.dup(A[0]);os.dup(A[1])
	@staticmethod
	def curses_main(win,tree):
		B=win;B.clear();B.refresh();curses.nl();curses.noecho();B.timeout(0);B.nodelay(False);tree.expand();A=3;E=_A;curses.use_default_colors()
		while True:
			B.clear();curses.init_pair(1,curses.COLOR_WHITE,curses.COLOR_BLUE);D=0;F=max(0,A-curses.LINES+3)
			for(G,H)in tree.traverse():
				if D==A:
					B.attrset(curses.color_pair(1)|curses.A_BOLD)
					if E:getattr(G,E)();E=_A
				else:B.attrset(curses.color_pair(0))
				if 0<=D-F<curses.LINES-1:B.addstr(D-F,0,G.render(H,curses.COLS))
				D+=1
			B.refresh();C=B.getch()
			if C==curses.KEY_UP:A-=1
			elif C==curses.KEY_DOWN:A+=1
			elif C==curses.KEY_PPAGE:
				A-=curses.LINES
				if A<0:A=0
			elif C==curses.KEY_NPAGE:
				A+=curses.LINES
				if A>=D:A=D-1
			elif C==curses.KEY_RIGHT:E='expand'
			elif C==curses.KEY_LEFT:E='collapse'
			elif C==ord(' '):E='toggle'
			elif C==ESC:return
			A%=D
	@staticmethod
	def open_tty():A='/dev/tty';B=os.dup(0);C=os.dup(1);os.close(0);os.close(1);os.open(A,os.O_RDONLY);os.open(A,os.O_RDWR);return B,C
	@classmethod
	def log(A,*D,**E):
		if A.LOG:B=logging.getLogger(__file__);C=logging.FileHandler('cloud_pods_viewer.log');F=logging.Formatter('%(asctime)s %(levelname)s %(message)s');C.setFormatter(F);B.addHandler(C);B.setLevel(logging.INFO)
		A.LOG.info(*D,**E)
class TreeRendererJSON(TreeRenderer):
	@staticmethod
	def impl_name():return'json'
	def render_tree(A,dict_obj):print(json.dumps(dict_obj,indent=4))