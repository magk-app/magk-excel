import os,tempfile
from typing import List
import distro
from localstack.packages import InstallTarget,Package
from localstack.utils.files import new_tmp_file,rm_rf,save_file
from localstack.utils.http import download
from localstack.utils.run import run
from localstack_ext.packages import OSPackageInstaller
POSTGRES_MAJOR_VERSION_RANGE=['10','11','12','13','14','15']
POSTGRES_RPM_REPOSITORY='https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm'
class PostgresqlPackageInstaller(OSPackageInstaller):
	def __init__(A,version):super().__init__('postgresql',version);A._debian_install_dir=os.path.join('/usr/lib/postgresql',A.version);A._debian_package_list=[f"postgresql-{A.version}"];A._redhat_install_dir=os.path.join(f"/usr/pgsql-{A.version}/");A._redhat_package_list=[f"postgresql{A.version}-devel",f"postgresql{A.version}-server",f"postgresql{A.version}-plpython3"]
	def _debian_get_install_dir(A,target):return A._debian_install_dir
	def _debian_get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin','psql')
	def _debian_packages(A):return A._debian_package_list
	def _debian_prepare_install(D,target):
		B='/etc/apt/sources.list.d/pgdg.list'
		if not os.path.exists(B):A=new_tmp_file();download('https://www.postgresql.org/media/keys/ACCC4CF8.asc',A);run(['apt-key','add',A]);rm_rf(A);C=f"deb http://apt.postgresql.org/pub/repos/apt {distro.codename()}-pgdg main";save_file(B,C)
		super()._debian_prepare_install(target)
	def _debian_post_process(B,target):
		with tempfile.TemporaryDirectory(suffix='postgresql-plpython3-install')as A:run(['apt-get','download',f"postgresql-plpython3-{B.version}"],cwd=A);run('dpkg-deb -xv postgresql-plpython3-*.deb /',cwd=A)
	def _redhat_get_install_dir(A,target):return A._redhat_install_dir
	def _redhat_get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin','psql')
	def _redhat_packages(A):return A._redhat_package_list
	def _redhat_prepare_install(A,target):run(['dnf','install','-y',POSTGRES_RPM_REPOSITORY]);super()._redhat_prepare_install(target)
class PostgresqlPackage(Package):
	def __init__(A,default_version='11'):super().__init__(name='PostgreSQL',default_version=default_version)
	def get_versions(A):return POSTGRES_MAJOR_VERSION_RANGE
	def _get_installer(A,version):return PostgresqlPackageInstaller(version)
postgresql_package=PostgresqlPackage()