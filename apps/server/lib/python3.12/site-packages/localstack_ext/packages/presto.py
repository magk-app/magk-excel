import os
from typing import List
from localstack.constants import MAVEN_REPO_URL
from localstack.packages import InstallTarget,Package
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
from localstack.utils.files import cp_r,save_file
from localstack_ext.packages.cve_fixes import CVEFix,FixStrategyDelete,fix_cves_in_jar_files
URL_PATTERN_PRESTO=f"{MAVEN_REPO_URL}/io/trino/trino-server/<version>/trino-server-<version>.tar.gz"
PRESTO_DEFAULT_VERSION='389'
PRESTO_VERSIONS=[PRESTO_DEFAULT_VERSION]
PRESTO_JVM_CONFIG='\n-server\n-Xmx1G\n-XX:-UseBiasedLocking\n-XX:+UseG1GC\n-XX:+UseGCOverheadLimit\n-XX:+ExplicitGCInvokesConcurrent\n-XX:+HeapDumpOnOutOfMemoryError\n-XX:+ExitOnOutOfMemoryError\n-XX:ReservedCodeCacheSize=150M\n-Duser.timezone=UTC\n-Djdk.attach.allowAttachSelf=true\n-Djdk.nio.maxCachedBufferSize=2000000\n-Dpresto-temporarily-allow-java8=true\n'
PRESTO_CONFIG_PROPS='\nnode.id=presto-master\nnode.environment=test\ncoordinator=true\nnode-scheduler.include-coordinator=true\nhttp-server.http.port=8080\nquery.max-memory=512MB\nquery.max-memory-per-node=512MB\n# query.max-total-memory-per-node=512MB\ndiscovery-server.enabled=true\ndiscovery.uri=http://localhost:8080\nprotocol.v1.alternate-header-name=Presto\n'
class PrestoInstaller(ArchiveDownloadAndExtractInstaller):
	def __init__(A,version):super().__init__(name='presto',version=version,extract_single_directory=True)
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin','launcher')
	def _get_download_url(A):return URL_PATTERN_PRESTO.replace('<version>',A.version)
	def _post_process(B,target):
		F='config.properties';E='jvm.config';from localstack_ext.packages.hive import ICEBERG_JAR_URL as G;from localstack_ext.packages.spark import download_and_cache_jar_file as H;C=B.get_installed_dir();A=os.path.join(C,'etc')
		if not os.path.exists(os.path.join(A,E)):save_file(os.path.join(A,E),PRESTO_JVM_CONFIG)
		if not os.path.exists(os.path.join(A,F)):save_file(os.path.join(A,F),PRESTO_CONFIG_PROPS)
		I=os.path.join(C,'lib');J=H(G);D=os.path.join(I,'iceberg.jar')
		if not os.path.exists(D):cp_r(J,D)
		B._apply_cve_fixes(target)
	def _apply_cve_fixes(B,target):A=CVEFix(paths=['presto/389/plugin/phoenix5/trino-phoenix5-patched-389.jar','presto/389/plugin/pinot/helix-core-0.9.8.jar'],strategy=FixStrategyDelete());fix_cves_in_jar_files(target,fixes=[A])
class PrestoPackage(Package):
	def __init__(A,default_version=PRESTO_DEFAULT_VERSION):super().__init__(name='Presto',default_version=default_version)
	def get_versions(A):return PRESTO_VERSIONS
	def _get_installer(A,version):return PrestoInstaller(version)
presto_package=PrestoPackage()