_A='5.16.6'
import os
from typing import List
from localstack.packages import Package,PackageInstaller
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
ACTIVE_MQ_URL='https://archive.apache.org/dist/activemq/<ver>/apache-activemq-<ver>-bin.tar.gz'
class ActiveMQPackage(Package):
	def __init__(A):super().__init__('ActiveMQ',_A)
	def get_versions(A):return[_A]
	def _get_installer(A,version):return ActiveMQPackageInstaller('active-mq',version)
class ActiveMQPackageInstaller(ArchiveDownloadAndExtractInstaller):
	def _get_download_url(A):return ACTIVE_MQ_URL.replace('<ver>',A.version)
	def _get_archive_subdir(A):return f"apache-activemq-{A.version}"
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,f"apache-activemq-{A.version}",'bin','activemq')
active_mq_package=ActiveMQPackage()