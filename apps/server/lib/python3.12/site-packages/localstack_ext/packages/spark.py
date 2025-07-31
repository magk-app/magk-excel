_D='all'
_C='aws-glue-libs'
_B='2.2.1'
_A=None
import glob,logging,os,re,shutil,textwrap,threading
from typing import Dict,List,Optional
from localstack import config
from localstack.constants import MAVEN_REPO_URL
from localstack.packages import InstallTarget,Package,PackageInstaller
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
from localstack.utils.archives import download_and_extract_with_retry,unzip
from localstack.utils.files import cp_r,file_exists_not_empty,load_file,mkdir,new_tmp_dir,rm_rf,save_file
from localstack.utils.http import download
from localstack.utils.run import run
from localstack.utils.testutil import create_zip_file
from localstack_ext.constants import S3_ASSETS_BUCKET_URL
from localstack_ext.packages.java import java_package
LOG=logging.getLogger(__name__)
SPARK_URL='https://archive.apache.org/dist/spark/spark-{version}/spark-{version}-bin-without-hadoop.tgz'
DEFAULT_SPARK_VERSION=os.getenv('SPARK_DEFAULT_VERSION','').strip()or'2.4.3'
SPARK_VERSIONS=[DEFAULT_SPARK_VERSION,_B,'2.4.8','3.1.1','3.1.2','3.3.0']
AWS_SDK_VER='1.12.339'
INSTALL_LOCK=threading.RLock()
AWS_GLUE_LIBS_DIR=_C
AWS_GLUE_LIBS_URL='https://github.com/awslabs/aws-glue-libs/archive/refs/heads/glue-1.0.zip'
AWS_GLUE_JAVA_LIBS_URL=f"{S3_ASSETS_BUCKET_URL}/aws-glue-libs.zip"
SPARK_JAR_URLS={_D:[f"{MAVEN_REPO_URL}/com/amazonaws/aws-java-sdk-bundle/{AWS_SDK_VER}/aws-java-sdk-bundle-{AWS_SDK_VER}.jar",f"{MAVEN_REPO_URL}/org/apache/hadoop/hadoop-hdfs/<hadoop_version>/hadoop-hdfs-<hadoop_version>.jar",f"{MAVEN_REPO_URL}/org/apache/hadoop/hadoop-common/<hadoop_version>/hadoop-common-<hadoop_version>.jar",f"{MAVEN_REPO_URL}/org/apache/hadoop/hadoop-auth/<hadoop_version>/hadoop-auth-<hadoop_version>.jar",f"{MAVEN_REPO_URL}/org/apache/hadoop/hadoop-aws/<hadoop_version>/hadoop-aws-<hadoop_version>.jar",f"{MAVEN_REPO_URL}/com/typesafe/config/1.3.3/config-1.3.3.jar",f"{MAVEN_REPO_URL}/com/github/tony19/named-regexp/0.2.6/named-regexp-0.2.6.jar",f"{MAVEN_REPO_URL}/com/amazon/emr/emr-dynamodb-hadoop/4.12.0/emr-dynamodb-hadoop-4.12.0.jar",f"{MAVEN_REPO_URL}/com/google/guava/guava/30.0-jre/guava-30.0-jre.jar",f"{MAVEN_REPO_URL}/org/apache/commons/commons-configuration2/2.7/commons-configuration2-2.7.jar",f"{MAVEN_REPO_URL}/commons-configuration/commons-configuration/1.10/commons-configuration-1.10.jar",f"{MAVEN_REPO_URL}/org/apache/commons/commons-text/1.9/commons-text-1.9.jar",f"{MAVEN_REPO_URL}/commons-lang/commons-lang/2.6/commons-lang-2.6.jar",f"{MAVEN_REPO_URL}/org/apache/logging/log4j/log4j-api/2.14.0/log4j-api-2.14.0.jar",f"{MAVEN_REPO_URL}/org/postgresql/postgresql/42.3.1/postgresql-42.3.1.jar",f"{MAVEN_REPO_URL}/com/google/guava/failureaccess/1.0.1/failureaccess-1.0.1.jar",f"{MAVEN_REPO_URL}/org/apache/hadoop/thirdparty/hadoop-shaded-protobuf_3_7/1.0.0/hadoop-shaded-protobuf_3_7-1.0.0.jar",f"{MAVEN_REPO_URL}/com/google/re2j/re2j/1.5/re2j-1.5.jar"],'(2\\..+)|(3\\.1\\.\\d)':[f"{MAVEN_REPO_URL}/com/fasterxml/jackson/dataformat/jackson-dataformat-csv/2.11.4/jackson-dataformat-csv-2.11.4.jar",f"{MAVEN_REPO_URL}/com/fasterxml/jackson/core/jackson-core/2.11.4/jackson-core-2.11.4.jar",f"{MAVEN_REPO_URL}/de/undercouch/bson4jackson/2.11.0/bson4jackson-2.11.0.jar"],'3\\.3\\.0':[f"{MAVEN_REPO_URL}/com/fasterxml/jackson/dataformat/jackson-dataformat-csv/2.13.3/jackson-dataformat-csv-2.13.3.jar",f"{MAVEN_REPO_URL}/com/fasterxml/jackson/core/jackson-core/2.13.3/jackson-core-2.13.3.jar",f"{MAVEN_REPO_URL}/de/undercouch/bson4jackson/2.13.1/bson4jackson-2.13.1.jar"]}
REPO_URL_GLUE_LIBS='git+https://github.com/awslabs/aws-glue-libs.git#egg=aws-glue-libs'
REPO_URL_GLUE_LIBS_0_9='git+https://github.com/localstack/aws-glue-libs.git@glue-0.9#egg=aws-glue-libs'
class SparkPackage(Package):
	def __init__(A):super().__init__('Spark',default_version=DEFAULT_SPARK_VERSION)
	def get_versions(A):return SPARK_VERSIONS
	def _get_installer(A,version):return SparkInstaller(version)
class SparkInstaller(ArchiveDownloadAndExtractInstaller):
	def __init__(A,version):super().__init__(name='spark',version=version,extract_single_directory=True)
	def _get_download_url(A):return SPARK_URL.format(version=A.version)
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin','spark-submit')
	def _post_process(A,target):
		B=target;C=A.get_installed_dir();patch_spark_class(C);from localstack_ext.services.glue.packages import DEFAULT_GLUE_VERSION as D,copy_glue_libs_into_spark as E;install_hadoop_for_spark(A,target=B);install_awsglue_local(A);download_additional_jar_files(A.version);patch_spark_defaults_config_file(spark_home=A.get_installed_dir(),spark_version=A.version);patch_spark_python_dependencies(A);E(glue_version=D,target=B)
		if A.version.startswith('2.'):from localstack_ext.packages.java import java_package as F;F.get_installer('8').install()
		install_spark_glue_libs(install_target=B)
spark_package=SparkPackage()
def patch_spark_class(spark_home):A=['sed','-ie','$s/^exec "\\${CMD\\[@]}"/if [ -n "$SPARK_OVERWRITE_CP" ]; then CMD[2]="$SPARK_OVERWRITE_CP:${CMD[2]}"; fi\\nCMD=("${CMD[0]}" "-Dcom.amazonaws.sdk.disableCertChecking=true" "${CMD[@]:1}"); exec "${CMD[@]}"/',f"{spark_home}/bin/spark-class"];run(A)
def patch_spark_defaults_config_file(spark_home,spark_version):A=spark_jar_lib_location();B=spark_jar_lib_location(spark_version=spark_version);C=textwrap.dedent(f"spark.driver.extraClassPath {A}:{A}/*:{B}/*\n    spark.executor.extraClassPath {A}:{A}/*:{B}/*\n    spark.driver.allowMultipleContexts = true\n    ");save_file(f"{spark_home}/conf/spark-defaults.conf",C)
def install_hadoop_for_spark(spark_installer,target):
	B=spark_installer;from localstack_ext.packages.hadoop import hadoop_package as E;F=get_hadoop_version_for_spark_version(B.version);C=E.get_installer(F);C.install(target=target);A=C.get_installed_dir();D=os.listdir(A)
	if len(D)==1:A=os.path.join(A,D[0])
	G=os.path.join(A,'bin/hadoop')
	if not os.path.exists(G):raise Exception(f"Hadoop not fully installed in directory {A}")
	H=f'\n    export SPARK_DIST_CLASSPATH="$({A}/bin/hadoop classpath)"\n    export HADOOP_CONF_DIR="{A}/etc/hadoop"\n    ';save_file(f"{B.get_installed_dir()}/conf/spark-env.sh",H)
def install_awsglue_local(spark_installer):
	C='pip';B=REPO_URL_GLUE_LIBS
	if spark_installer.version==_B:B=REPO_URL_GLUE_LIBS_0_9
	D='0.9.0'if B==REPO_URL_GLUE_LIBS_0_9 else'4.0.0';LOG.debug("Expecting 'aws-glue-libs' version %s.",D)
	try:E=run([C,'show',_C]);A=re.search('Version:\\s+(.+)$',E,re.M).group(1).strip();LOG.debug("Determined 'aws-glue-libs' version %s.",A)
	except Exception:LOG.debug("Version of Python package 'aws-glue-libs' could not be determined...");A=_A
	if A==D:LOG.debug("Python package 'aws-glue-libs' already installed, skipping installation...");return
	if A:run([C,'uninstall','-y',_C])
	run([C,'install',B])
def patch_spark_python_dependencies(installer):E='co.co_freevars, co.co_cellvars, ';C=installer.get_installed_dir();A=os.path.join(C,'python/lib/py4j-*-src.zip');A=glob.glob(A)[0];B={'from collections import':'from collections.abc import'};replace_in_zip_file(A,'py4j/java_collections.py',B);A=os.path.join(C,'python/lib/pyspark.zip');B={'import collections\n':'import collections.abc\n','collections.Iterable':'collections.abc.Iterable'};replace_in_zip_file(A,'pyspark/resultiterable.py',B);D=textwrap.dedent('\n    def _walk_global_ops_patched(code):\n        for instr in dis.get_instructions(code):\n            op = instr.opcode\n            if op in GLOBAL_OPS:\n                yield instr.argval\n    out_names = {name for name in _walk_global_ops_patched(co)}\n    ');B={'obj.co_argcount, obj.co_kwonlyargcount':'obj.co_argcount, obj.co_posonlyargcount, obj.co_kwonlyargcount','co.co_argcount,\n        ':'co.co_argcount, co.co_posonlyargcount, ','obj.co_name, obj.co_firstlineno, ':'obj.co_name, obj.co_qualname, obj.co_firstlineno, ','co.co_name,\n        ':'co.co_name, co.co_qualname, ','obj.co_name,\n        ':'obj.co_name, obj.co_qualname, ',', obj.co_lnotab, obj.co_freevars,':', obj.co_lnotab, obj.co_exceptiontable, obj.co_freevars,','co.co_lnotab,\n        ':'co.co_lnotab, co.co_exceptiontable, ','obj.co_linetable, obj.co_freevars':'obj.co_linetable, obj.co_exceptiontable, obj.co_freevars','co.co_cellvars,  # this is the trickery\n            (),':E,'co.co_cellvars,  # co_freevars is initialized with co_cellvars\n        (),':E,'oparg in _walk_global_ops(co))':'oparg in _walk_global_ops(co) if len(names) > oparg)\n'+textwrap.indent(D,' '*16),'oparg in _walk_global_ops(co)}':'oparg in _walk_global_ops(co) if len(names) > oparg}\n'+textwrap.indent(D,' '*8),'def cell_set(cell, value):\n    """':'def cell_set(cell, value):\n    cell.cell_contents = value; return\n    """'};replace_in_zip_file(A,'pyspark/cloudpickle.py',B);replace_in_zip_file(A,'pyspark/cloudpickle/cloudpickle.py',B);replace_in_zip_file(A,'pyspark/cloudpickle/cloudpickle_fast.py',B)
def replace_in_zip_file(zip_file,file_path,search_replace,raise_if_missing=False):
	C=zip_file;A=new_tmp_dir();unzip(C,A);B=os.path.join(A,file_path)
	if not os.path.exists(B):
		if raise_if_missing:raise Exception(f"Unable to replace content in non-existing file in archive: {B}")
		return
	replace_in_file(B,search_replace);create_zip_file(A,C);rm_rf(A)
def replace_in_file(file_path,search_replace):
	B=file_path;A=load_file(B)
	for(C,D)in search_replace.items():A=A.replace(C,D)
	save_file(B,A)
def get_hadoop_version_for_spark_version(spark_version):
	from localstack_ext.packages.hadoop import HADOOP_DEFAULT_VERSION as A
	if spark_version==_B:return'2.10.2'
	return A
def get_spark_install_cache_dir(spark_version):A=spark_package.get_installer(spark_version);return A.get_installed_dir()or A._get_install_dir(InstallTarget.VAR_LIBS)
def download_additional_jar_files(spark_version):
	E='<hadoop_version>';A=spark_version;C=[B for B in SPARK_JAR_URLS if re.match(B,A)]
	if len(C)!=1:raise Exception(f"Expected exactly one match for Spark version {A}, got: {C}")
	F=get_hadoop_version_for_spark_version(spark_version=A)
	for D in(_D,C[0]):
		G=SPARK_JAR_URLS[D]
		for B in G:H=D!=_D or E in B;I={'sub_dir':f"spark-{A}"}if H else{};B=B.replace(E,F);download_and_cache_jar_file(B,**I)
	return spark_jar_lib_location()
def download_and_cache_jar_file(jar_url,sub_dir=_A):
	E=sub_dir;D=jar_url;F=D.split('/')[-1];A=spark_jar_lib_location()
	if E:A=os.path.join(A,E)
	mkdir(A);B=os.path.join(A,F)
	if file_exists_not_empty(B):return B
	C=os.path.join(spark_jar_lib_location(cache=True),F)
	if not file_exists_not_empty(C):download(D,C)
	mkdir(os.path.dirname(B));cp_r(C,B);return C
def spark_jar_lib_location(cache=False,spark_version=_A):C=cache;A=spark_version;spark_package.install(version=A);D=spark_package.get_installed_dir(version=A);E=os.path.dirname(os.path.dirname(D));B=os.path.join(E,'bigdata-jars'if C else'gluePyspark');B=os.path.join(B,f"spark-{A}")if A and not C else B;return B
def add_java_home_env_for_spark_version(spark_version,env_vars):
	A=env_vars
	if spark_version.startswith('2.'):B=java_package.get_installer('8');B.install();A['JAVA_HOME']=B.get_java_home()
	return A
def get_spark_glue_libs_dir(install_target=_A):
	A=install_target
	if A:return os.path.join(A.value,AWS_GLUE_LIBS_DIR)
	B=spark_package.get_installer();C=os.path.realpath(B.get_installed_dir())
	if C.startswith(os.path.realpath(config.dirs.static_libs)):return os.path.join(config.dirs.static_libs,AWS_GLUE_LIBS_DIR)
	return os.path.join(config.dirs.var_libs,AWS_GLUE_LIBS_DIR)
def install_spark_glue_libs(install_target):
	A=get_spark_glue_libs_dir()
	if not os.path.exists(A):E=f"{A}.tmp";C=os.path.join(config.dirs.tmp,'aws-glue-libs.zip');download_and_extract_with_retry(AWS_GLUE_LIBS_URL,C,E);shutil.move(os.path.join(E,'aws-glue-libs-glue-1.0'),A)
	B=os.path.join(A,'jarsv1');D=os.path.join(A,'conf/spark-defaults.conf')
	if not os.path.exists(D):F=os.path.join(A,'bin/glue-setup.sh');H=re.sub('^mvn','# mvn',load_file(F),flags=re.M);save_file(F,H);I=f"spark.driver.extraClassPath {B}/*\n"+f"spark.executor.extraClassPath {B}/*\n"+'spark.driver.allowMultipleContexts = true';mkdir(os.path.dirname(D));save_file(D,I)
	if not os.path.exists(f"{B}/aws-java-sdk-1.11.774.jar"):
		LOG.debug('Fetching additional JARs for Glue job execution (this may take some time)');mkdir(B);C=os.path.join(config.dirs.tmp,'aws-glue-libs-java.zip');G=os.path.join(config.dirs.tmp,'aws-glue-libs-java');download_and_extract_with_retry(AWS_GLUE_JAVA_LIBS_URL,C,G)
		for J in glob.glob(os.path.join(G,'*.jar')):shutil.move(J,B)