import importlib
from pkgutil import iter_modules

from localstack.utils.objects import singleton_factory
from setuptools import find_packages


def _find_modules(path) -> set[str]:
    # copied from plux (plugin.discovery.PackagePathPluginFinder)
    modules = set()

    for pkg in find_packages(path):
        modules.add(pkg)
        pkgpath = path + "/" + pkg.replace(".", "/")
        for info in iter_modules([pkgpath]):
            if not info.ispkg:
                modules.add(pkg + "." + info.name)

    return modules


@singleton_factory
def register():
    # recursively import all reducer submodules to trigger registering
    import localstack_ext.persistence.pickling as root

    for module in _find_modules(root.__path__[0]):
        if not module.startswith("reducers."):
            continue
        importlib.import_module(root.__name__ + "." + module)
