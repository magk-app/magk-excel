_A='3.5.2'
import logging,os
from typing import List
from localstack.packages import DownloadInstaller,InstallTarget,Package,PackageInstaller
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
from localstack.utils.archives import download_and_extract_with_retry
from localstack.utils.http import download
LOG=logging.getLogger(__name__)
NEO4J_JAR_URL='https://dist.neo4j.org/neo4j-community-<ver>-unix.tar.gz'
NEO4J_DEFAULT_VERSION='4.4.18'
TINKERPOP_ID_MANAGER_URL='https://github.com/localstack/localstack-artifacts/raw/f5a4d44ccc2a3f8ed1a584844f070fcf600b24f6/tinkerpop-id-manager/tinkerpop-id-manager.jar'
TINKERPOP_ID_MANAGER_FILE_NAME='tinkerpop-id-manager.jar'
TINKERPOP_DEFAULT_VERSION='3.4.13'
GREMLIN_SERVER_URL_TEMPLATE='https://archive.apache.org/dist/tinkerpop/{version}/apache-tinkerpop-gremlin-server-{version}-bin.zip'
TINKERPOP_VERSION_SUPPORT_NEPTUNE={'1.1.0.0':'3.4.11','1.1.1.0':_A,'1.2.0.0':_A,'1.2.0.1':_A,'1.2.0.2':_A,'1.2.1.0':'3.6.2'}
def get_gremlin_version_for_neptune_db_version(neptune_version):
	A=neptune_version
	if A:return TINKERPOP_VERSION_SUPPORT_NEPTUNE.get(A,TINKERPOP_DEFAULT_VERSION)
	return TINKERPOP_DEFAULT_VERSION
class Neo4JPackage(Package):
	def __init__(A):super().__init__('Neo4J',NEO4J_DEFAULT_VERSION)
	def get_versions(A):return[NEO4J_DEFAULT_VERSION]
	def _get_installer(A,version):return Neo4JPackageInstaller('neo4j',version)
class Neo4JPackageInstaller(ArchiveDownloadAndExtractInstaller):
	def _get_download_url(A):return NEO4J_JAR_URL.replace('<ver>',A.version)
	def _get_archive_subdir(A):return f"neo4j-community-{A.version}"
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,f"neo4j-community-{A.version}",'bin','neo4j')
class TinkerpopPackage(Package):
	def __init__(A):super().__init__('Tinkerpop',TINKERPOP_DEFAULT_VERSION)
	def get_versions(A):return list(set([TINKERPOP_DEFAULT_VERSION]+list(TINKERPOP_VERSION_SUPPORT_NEPTUNE.values())))
	def _get_installer(A,version):return TinkerpopPackageInstaller('tinkerpop',version)
class TinkerpopPackageInstaller(DownloadInstaller):
	def _get_download_url(A):return GREMLIN_SERVER_URL_TEMPLATE.format(version=A.version)
	def _install(A,target):
		C=target;B=A._get_install_dir(C);E=A._get_install_marker_path(B);D=os.path.join(A._get_install_dir(C),TINKERPOP_ID_MANAGER_FILE_NAME)
		if not os.path.exists(D):download(TINKERPOP_ID_MANAGER_URL,D)
		if not os.path.exists(E):LOG.debug('Downloading dependencies for Neptune Graph DB API (this may take some time) ...');F=os.path.join(B,'neptunedb.zip');download_and_extract_with_retry(A._get_download_url(),F,B)
	def _get_archive_subdir(A):return f"apache-tinkerpop-gremlin-server-{A.version}"
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,f"apache-tinkerpop-gremlin-server-{A.version}",'bin','gremlin-server.sh')
neo4j_package=Neo4JPackage()
tinkerpop_package=TinkerpopPackage()