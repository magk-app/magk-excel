from enum import Enum
class MergeStrategy(Enum):OVERWRITE='overwrite';MERGE='merge'
DEFAULT_STRATEGY=MergeStrategy.MERGE.value