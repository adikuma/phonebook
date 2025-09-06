import time
from typing import Callable, Any, Awaitable, Iterable, Tuple, Dict, Optional


# tiny step runner with timing + retries; passes shared ctx into each step
async def run_steps(
    steps: Iterable[Tuple[str, Callable[[Dict[str, Any]], Awaitable[Any]]]],
    *,
    retries: int = 0,
    on_event: Optional[Callable[[Dict[str, Any]], None]] = None,
) -> Dict[str, Any]:
    ctx: Dict[str, Any] = {}
    for name, step in steps:
        attempt = 0
        while True:
            t0 = time.perf_counter()
            try:
                result = await step(ctx)
                ctx[name] = result
                if on_event:
                    on_event(
                        {
                            "type": "step_ok",
                            "step": name,
                            "ms": round((time.perf_counter() - t0) * 1000),
                        }
                    )
                break
            except Exception as e:
                attempt += 1
                if on_event:
                    on_event(
                        {
                            "type": "step_err",
                            "step": name,
                            "ms": round((time.perf_counter() - t0) * 1000),
                            "err": str(e),
                            "attempt": attempt,
                        }
                    )
                if attempt > retries:
                    raise
    return ctx
