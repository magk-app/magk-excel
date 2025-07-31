_B='jar-cve-fixes'
_A=None
import dataclasses,logging,os,tempfile
from abc import ABC,abstractmethod
from typing import Callable,List
from zipfile import ZipFile
from localstack import config
from localstack.constants import ARTIFACTS_REPO,MAVEN_REPO_URL
from localstack.packages import InstallTarget
from localstack.utils.collections import ensure_list
from localstack.utils.files import cp_r,load_file,rm_rf
from localstack.utils.http import download
LOG=logging.getLogger(__name__)
BIGDATA_SKIP_CVE_FIXES=config.is_env_true('BIGDATA_SKIP_CVE_FIXES')
HTRACE_NOOP_JAR_URL=f"{ARTIFACTS_REPO}/raw/f1a506a5cfffd9cd9cbd48307ffce20992dc643c/htrace-noop/htrace-noop-0.1.jar"
@dataclasses.dataclass
class FixStrategy:
	@abstractmethod
	def apply(self,file_path):0
@dataclasses.dataclass
class FixStrategyDelete(FixStrategy):
	def apply(A,file_path):_delete_file(file_path)
class ZipEntryRenamer(ABC):
	def __call__(A,source_entry):0
class DefaultZipEntryRenamer(ZipEntryRenamer):
	def __call__(B,source_entry):
		A=source_entry
		if A.startswith('META-INF/services/'):return A
		if A.startswith('META-INF/'):return
		if not A.endswith('.class'):return
		return A
@dataclasses.dataclass
class FixStrategyPatchJAR(FixStrategy):
	patch_libs:List[str]|_A=_A;zip_entry_renamer:ZipEntryRenamer|_A=_A
	def apply(C,file_path):
		D=C.zip_entry_renamer or DefaultZipEntryRenamer()
		for A in C.patch_libs or[]:
			if'://'in A:
				B=os.path.join(config.dirs.var_libs,_B,os.path.basename(A))
				if not os.path.exists(B):download(A,B)
			else:B=download_latest_jar_version(A)
			copy_entries_into_zip_file(B,target_zip_file=file_path,file_renamer=D)
@dataclasses.dataclass
class FixStrategyDownloadFile(FixStrategy):
	file_url:str;target_path:str
	def apply(A,file_path):
		if not os.path.exists(A.target_path):LOG.warning('Target path for CVE patch %s does not exist: %s',A.file_url,A.target_path);return
		B=os.path.join(config.dirs.var_libs,_B,os.path.basename(A.file_url))
		if not os.path.exists(B):download(A.file_url,B)
		cp_r(B,A.target_path)
@dataclasses.dataclass
class CVEFix:paths:List[str];strategy:FixStrategy|List[FixStrategy]
def fix_cves_in_jar_files(target,fixes):
	if BIGDATA_SKIP_CVE_FIXES:return
	for B in fixes:
		D=ensure_list(B.strategy)
		for A in B.paths:
			A=os.path.join(target.value,A)
			for C in D:
				if'.war:'in A:E,A=A.split(':');fix_cve_in_war_jar_file(C,E,A)
				else:fix_cve_in_jar_file(C,A)
def fix_cve_in_war_jar_file(strategy,war_file,jar_file):
	C=jar_file;B=strategy;A=war_file
	if not os.path.exists(A):return
	if isinstance(B,FixStrategyDelete):B.apply(A);return
	with tempfile.TemporaryFile(suffix='.jar')as D:_extract_file_from_zip(A,C,D);B.apply(C);_add_file_to_zip(A,C,D)
def fix_cve_in_jar_file(strategy,jar_file):
	B=strategy;A=jar_file
	if not os.path.exists(A):return
	LOG.debug('Applying CVE fix strategy %s on JAR file %s',B.__class__.__name__,A);B.apply(A)
def download_latest_jar_version(maven_ref,target_file=_A):
	A=target_file;E,B,C=maven_ref.split(':');D=f"{MAVEN_REPO_URL}/{E.replace('.','/')}/{B}/{C}/{B}-{C}.jar";A=A or os.path.join(config.dirs.var_libs,_B,os.path.basename(D))
	if not os.path.exists(A):download(D,A)
	return A
def copy_entries_into_zip_file(source_zip_file,target_zip_file,file_renamer=_A):
	E=file_renamer;D=target_zip_file;C=source_zip_file
	with ZipFile(C,'r')as F,ZipFile(D,'a')as G:
		for A in F.namelist():
			B=E(A)if E else A
			if not B:continue
			H=F.read(A)
			if config.is_trace_logging_enabled():LOG.debug(f"Adding entry {A} ({len(H)} bytes) from {C} to {D} (as {B}), target exists: {B in G.namelist()}")
			G.writestr(B,data=H)
def _delete_file(file_path,create_backup=False):
	A=file_path
	if create_backup:os.rename(A,f"{A}.bk")
	else:rm_rf(A)
def _extract_file_from_zip(zip_file,zip_entry,target_file):
	A=target_file
	with ZipFile(zip_file,'r')as B:B.extract(zip_entry,path=A);return A
def _add_file_to_zip(zip_file,zip_entry,file_path):
	with ZipFile(zip_file,'a')as A:A.writestr(zip_entry,data=load_file(file_path,mode='rb'))