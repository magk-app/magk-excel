_A='partiql'
import os
from typing import List
from localstack.packages import Package,PackageInstaller
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
PARTIQL_URL='https://github.com/partiql/partiql-lang-kotlin/releases/download/v<ver>-alpha/partiql-cli-<ver>.zip'
class PartiqlPackage(Package):
	def __init__(A):super().__init__('Partiql','0.2.1')
	def get_versions(A):return['0.2.1']
	def _get_installer(A,version):return PartiqlPackageInstaller(_A,version)
class PartiqlPackageInstaller(ArchiveDownloadAndExtractInstaller):
	def _get_download_url(A):return PARTIQL_URL.replace('<ver>',A.version)
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,'partiql-cli-0.2.1','bin',_A)
partiql_package=PartiqlPackage()