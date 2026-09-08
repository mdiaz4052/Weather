"""Manual live check; intentionally absent from deterministic CI."""

import asyncio
from pathlib import Path

from weather_api.provider import GFSProvider


async def main():
    provider = GFSProvider(Path(".cache"))
    try:
        runs = await provider.list_runs()
        print("Discovered:", [run.runId for run in runs], flush=True)
        frame, _ = await provider.fetch_frame(runs[0].runId, 3, (-90, 30, -80, 45), 2)
        print("Source state:", frame.sourceState)
        for field in frame.fields:
            print(field.id, field.validTime, field.horizontalGrid, field.temporalKind)
    finally:
        await provider.client.aclose()


if __name__ == "__main__":
    asyncio.run(main())
