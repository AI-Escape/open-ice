from app.loaders.booking import BookInLoader
from app.loaders.common import ICEDataLoader
from app.loaders.disposition import ProcessingDispositionLoader
from app.loaders.population import AverageDailyPopulationLoader
from app.loaders.stay import AverageStayLengthLoader
from app.loaders.release import BookOutReleaseLoader


def get_loaders(fy: str) -> list[ICEDataLoader]:
    return [
        AverageDailyPopulationLoader(fy),
        AverageStayLengthLoader(fy),
        BookInLoader(fy),
        BookOutReleaseLoader(fy),
        ProcessingDispositionLoader(fy),
    ]
