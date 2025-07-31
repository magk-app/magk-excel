import glob,logging,os,shutil
from typing import List
from localstack import config
from localstack.constants import MAVEN_REPO_URL
from localstack.packages import InstallTarget,Package
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
from localstack.utils.files import file_exists_not_empty
from localstack.utils.http import download
from localstack.utils.run import run
from localstack.utils.strings import short_uid
from localstack_ext.packages.cve_fixes import HTRACE_NOOP_JAR_URL,CVEFix,FixStrategyDelete,FixStrategyDownloadFile,fix_cves_in_jar_files
from localstack_ext.packages.spark import spark_package
LOG=logging.getLogger(__name__)
HIVE_REMOVE_JAR_FILES=['hive-jdbc-handler-*.jar']
ICEBERG_JAR_URL=f"{MAVEN_REPO_URL}/org/apache/iceberg/iceberg-hive-runtime/1.1.0/iceberg-hive-runtime-1.1.0.jar"
delta_core_version='0.6.0'
delta_core_scala_version='2.11'
HIVE_JAR_FILES=[f"{MAVEN_REPO_URL}/org/postgresql/postgresql/42.5.0/postgresql-42.5.0.jar",f"{MAVEN_REPO_URL}/org/apache/hive/hive-jdbc-handler/3.1.3/hive-jdbc-handler-3.1.3.jar",f"{MAVEN_REPO_URL}/io/delta/delta-core_{delta_core_scala_version}/{delta_core_version}/delta-core_{delta_core_scala_version}-{delta_core_version}.jar",f"{MAVEN_REPO_URL}/io/delta/delta-hive_{delta_core_scala_version}/{delta_core_version}/delta-hive_{delta_core_scala_version}-{delta_core_version}.jar",f"{MAVEN_REPO_URL}/io/delta/delta-standalone_{delta_core_scala_version}/{delta_core_version}/delta-standalone_{delta_core_scala_version}-{delta_core_version}.jar",f"{MAVEN_REPO_URL}/io/delta/delta-storage/2.2.0/delta-storage-2.2.0.jar",f"{MAVEN_REPO_URL}/com/chuusai/shapeless_2.11/2.3.10/shapeless_2.11-2.3.10.jar",f"{MAVEN_REPO_URL}/org/apache/tez/tez-api/0.10.2/tez-api-0.10.2.jar",f"{MAVEN_REPO_URL}/org/apache/tez/tez-dag/0.10.2/tez-dag-0.10.2.jar",ICEBERG_JAR_URL]
HIVE_LEGACY_HOME='/usr/local/apache-hive-<version>-bin'
HIVE_LEGACY_DEFAULT_VERSION='2.3.5'
URL_PATTERN_HIVE='https://dlcdn.apache.org/hive/hive-<version>/apache-hive-<version>-bin.tar.gz'
HIVE_DEFAULT_VERSION=os.getenv('HIVE_DEFAULT_VERSION','').strip()or'2.3.9'
HIVE_VERSIONS=[HIVE_DEFAULT_VERSION,'3.1.3']
class HiveInstaller(ArchiveDownloadAndExtractInstaller):
	def __init__(A,version):super().__init__(name='hive',version=version,extract_single_directory=True)
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin','hiveserver2')
	def _get_download_url(A):return URL_PATTERN_HIVE.replace('<version>',A.version)
	def _post_process(E,target):
		B=target;from localstack_ext.packages.hadoop import hadoop_package as F;from localstack_ext.packages.java import java_package as N;spark_package.install(target=B);F.install(target=B);O=N.get_installer('8');O.install();G=get_hive_home_dir();A=os.path.join(G,'lib');P=['hadoop-aws-*.jar','aws-java-sdk-bundle-*.jar'];H=F.get_installer().get_hadoop_home();Q=os.path.join(H,'share/hadoop/tools/lib')
		for C in P:
			for I in glob.glob(f"{Q}/{C}"):
				J=os.path.join(A,os.path.basename(I))
				if not os.path.exists(J):shutil.copy(I,J)
		for R in HIVE_REMOVE_JAR_FILES:
			C=f"{A}/{R}"
			for S in glob.glob(C):os.remove(S)
		for K in HIVE_JAR_FILES:
			L=os.path.join(A,K.rpartition('/')[2])
			if not file_exists_not_empty(L):download(K,L)
		D=glob.glob(os.path.join(H,'share/hadoop/hdfs/lib/guava-*-jre.jar'))
		if E.version.startswith('3.')and D:T=os.path.join(A,f"_{os.path.basename(D[0])}");run(['ln','-s',D[0],T])
		M=os.path.join(G,'bin/ext/debug.sh')
		if os.path.exists(M):os.remove(M)
		E._apply_cve_fixes(B)
	def _apply_cve_fixes(D,target):A=target;B=CVEFix(paths=['hive/2.3.9/lib/avatica-1.8.0.jar'],strategy=FixStrategyDelete());C=CVEFix(paths=['hive/2.3.9/lib/htrace-core-3.1.0-incubating.jar','hive/3.1.3/lib/avatica-1.11.0.jar','hive/3.1.3/lib/htrace-core-3.2.0-incubating.jar'],strategy=[FixStrategyDelete(),FixStrategyDownloadFile(file_url=HTRACE_NOOP_JAR_URL,target_path=os.path.join(A.value,'hadoop/3.3.1/share/hadoop/common'))]);fix_cves_in_jar_files(A,fixes=[B,C])
class HivePackage(Package):
	def __init__(A,default_version=HIVE_DEFAULT_VERSION):super().__init__(name='Hive',default_version=default_version)
	def get_versions(A):return HIVE_VERSIONS
	def _get_installer(A,version):return HiveInstaller(version)
hive_package=HivePackage()
def get_hive_home_dir(version=None):A=hive_package.get_installer(version).get_installed_dir();return A
def get_hive_warehouse_dir():
	if config.PERSISTENCE:A=config.dirs.data
	else:A=os.path.join(config.TMP_FOLDER,f"hive-{short_uid()}")
	return os.path.join(A,'hive-warehouse')
def get_hive_lib_dir(version=None):return os.path.join(get_hive_home_dir(version),'lib')