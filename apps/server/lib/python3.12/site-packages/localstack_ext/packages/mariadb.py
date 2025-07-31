_A='latest'
from typing import List
from localstack.packages import InstallTarget,Package
from localstack_ext.packages import OSPackageInstaller
class MariaDBPackageInstaller(OSPackageInstaller):
	def __init__(A):super().__init__('mariadb',_A)
	def _debian_get_install_dir(A,target):return'/var/lib/mysql'
	def _debian_get_install_marker_path(A,install_dir):return'/usr/sbin/mysqld'
	def _debian_packages(A):return['mariadb-server','mariadb-client']
class MariaDBPackage(Package):
	def __init__(A):super().__init__(name='MariaDB',default_version=_A)
	def get_versions(A):return[_A]
	def _get_installer(A,version):return MariaDBPackageInstaller()
mariadb_package=MariaDBPackage()