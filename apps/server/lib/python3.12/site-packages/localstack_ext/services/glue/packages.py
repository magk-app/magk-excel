_A='2.0'
import logging,os
from localstack.constants import MAVEN_REPO_URL
from localstack.packages import InstallTarget
from localstack.utils.files import cp_r,mkdir
from localstack.utils.http import download
from localstack_ext.constants import S3_ASSETS_BUCKET_URL
LOG=logging.getLogger(__name__)
DEFAULT_GLUE_VERSION=os.getenv('GLUE_DEFAULT_VERSION','').strip()or _A
SPARK_HOME_LEGACY='/usr/local/spark-{spark_version}{suffix}'
GLUE_TO_SPARK_VERSIONS={'0.9':'2.2.1','1.0':'2.4.3',_A:'2.4.3','3.0':'3.1.1','4.0':'3.3.0'}
GLUE_JARS_BASE_URL='https://aws-glue-etl-artifacts.s3.amazonaws.com/release/com/amazonaws'
GLUE_JARS={'all':[f"{GLUE_JARS_BASE_URL}/AWSGlueETL/<version>/AWSGlueETL-<version>.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueDynamicSchemaHiveFormat/1.0.0/AWSGlueDynamicSchemaHiveFormat-1.0.0.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueSimd4j/1.0.0/AWSGlueSimd4j-1.0.0.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueDynamicSchema/0.9.0/AWSGlueDynamicSchema-0.9.0.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueGrokFork/0.9.0/AWSGlueGrokFork-0.9.0.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueJdbcCommons/0.9.0/AWSGlueJdbcCommons-0.9.0.jar",f"{S3_ASSETS_BUCKET_URL}/NimbleParquet-1.0.jar",f"{S3_ASSETS_BUCKET_URL}/AWSGlueLineageCommons-1.0.jar",f"{MAVEN_REPO_URL}/org/apache/commons/commons-collections4/4.4/commons-collections4-4.4.jar",f"{MAVEN_REPO_URL}/it/unimi/dsi/fastutil/8.4.4/fastutil-8.4.4.jar",f"{MAVEN_REPO_URL}/com/fasterxml/jackson/dataformat/jackson-dataformat-xml/2.12.6/jackson-dataformat-xml-2.12.6.jar"],'0.9':[f"{GLUE_JARS_BASE_URL}/AWSGlueReaders/<version>/AWSGlueReaders-<version>.jar",f"{MAVEN_REPO_URL}/joda-time/joda-time/2.9.3/joda-time-2.9.3.jar",f"{MAVEN_REPO_URL}/mysql/mysql-connector-java/5.1.49/mysql-connector-java-5.1.49.jar"],'1.0':[f"{GLUE_JARS_BASE_URL}/AWSGlueReaders/<version>/AWSGlueReaders-<version>.jar",f"{S3_ASSETS_BUCKET_URL}/AWSGlueDataplane-1.0-Scala2.11.jar",f"{MAVEN_REPO_URL}/mysql/mysql-connector-java/5.1.49/mysql-connector-java-5.1.49.jar"],_A:[f"{GLUE_JARS_BASE_URL}/AWSGlueReaders/<version>/AWSGlueReaders-<version>.jar",f"{S3_ASSETS_BUCKET_URL}/AWSGlueDataplane-1.0-Scala2.11.jar",f"{MAVEN_REPO_URL}/mysql/mysql-connector-java/5.1.49/mysql-connector-java-5.1.49.jar"],'3.0':[f"{GLUE_JARS_BASE_URL}/AWSGlueReaders/<version>/AWSGlueReaders-<version>.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueArrowVectorShader/1.0/AWSGlueArrowVectorShader-1.0.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueLineageCommons/1.0/AWSGlueLineageCommons-1.0.jar",f"{S3_ASSETS_BUCKET_URL}/AWSGlueDataplane-1.0-Scala2.12.jar",f"{MAVEN_REPO_URL}/joda-time/joda-time/2.9.3/joda-time-2.9.3.jar",f"{MAVEN_REPO_URL}/mysql/mysql-connector-java/8.0.23/mysql-connector-java-8.0.23.jar",f"{MAVEN_REPO_URL}/org/apache/spark/spark-hive_2.12/3.1.1/spark-hive_2.12-3.1.1.jar",f"{MAVEN_REPO_URL}/io/delta/delta-core_2.12/1.0.1/delta-core_2.12-1.0.1.jar"],'4.0':[f"{GLUE_JARS_BASE_URL}/AWSGlueArrowVectorShader/1.0/AWSGlueArrowVectorShader-1.0.jar",f"{GLUE_JARS_BASE_URL}/AWSGlueLineageCommons/1.0/AWSGlueLineageCommons-1.0.jar",f"{S3_ASSETS_BUCKET_URL}/AWSGlueDataplane-1.0-Scala2.12.jar",f"{S3_ASSETS_BUCKET_URL}/AWSGlueReaders-4.0.0.jar",f"{MAVEN_REPO_URL}/joda-time/joda-time/2.10.13/joda-time-2.10.13.jar",f"{MAVEN_REPO_URL}/mysql/mysql-connector-java/8.0.30/mysql-connector-java-8.0.30.jar",f"{MAVEN_REPO_URL}/org/json4s/json4s-core_2.12/3.7.0-M11/json4s-core_2.12-3.7.0-M11.jar",f"{MAVEN_REPO_URL}/org/json4s/json4s-ast_2.12/3.7.0-M11/json4s-ast_2.12-3.7.0-M11.jar",f"{MAVEN_REPO_URL}/org/json4s/json4s-scalap_2.12/3.7.0-M11/json4s-scalap_2.12-3.7.0-M11.jar",f"{MAVEN_REPO_URL}/org/json4s/json4s-jackson_2.12/3.7.0-M11/json4s-jackson_2.12-3.7.0-M11.jar",f"{MAVEN_REPO_URL}/org/apache/spark/spark-hive_2.12/3.3.0/spark-hive_2.12-3.3.0.jar",f"{MAVEN_REPO_URL}/io/delta/delta-core_2.12/2.3.0/delta-core_2.12-2.3.0.jar",f"{MAVEN_REPO_URL}/io/delta/delta-storage/2.4.0/delta-storage-2.4.0.jar"]}
def copy_glue_libs_into_spark(glue_version,target=None):
	C=glue_version;from localstack_ext.packages.spark import get_spark_install_cache_dir as G;E=get_spark_for_glue_version(C);H=GLUE_JARS.get('all')+GLUE_JARS.get(C,[]);I=os.path.join(G(E),'jars');J=f"{get_spark_home(E)}/jars";A=f"{C}.0";A='1.0.0'if A=='2.0.0'else A
	for B in H:
		B=B.replace('<version>',A);F=B.rpartition('/')[2];D=os.path.join(I,F)
		if not os.path.exists(D):download(B,D)
		K=f"{J}/{F}";copy_file_if_not_exists(D,K)
def get_spark_for_glue_version(glue_version):
	B=glue_version;A=GLUE_TO_SPARK_VERSIONS.get(B)
	if not A:LOG.warning('Unable to find Spark version for Glue version %s',B);A=GLUE_TO_SPARK_VERSIONS[DEFAULT_GLUE_VERSION]
	return A
def get_spark_home(spark_version=None):A=spark_version;from localstack_ext.packages.spark import get_spark_install_cache_dir as B;A=A or GLUE_TO_SPARK_VERSIONS[DEFAULT_GLUE_VERSION];return B(A)
def copy_file_if_not_exists(local_path,target_path):
	B=local_path;A=target_path
	if os.path.realpath(B)==os.path.realpath(A):return
	mkdir(os.path.dirname(A));cp_r(B,A)