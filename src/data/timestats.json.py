# /// script
# dependencies = ["numpy"]
# ///

import json
from datetime import UTC, datetime, timedelta

import numpy as np


def main():
    data = []
    gen = np.random.default_rng(seed=42)
    rands = gen.standard_normal(10000)
    for i, rand in enumerate(rands):
        d = datetime.now(UTC) - timedelta(days=i)
        ts = d.isoformat(timespec="seconds")
        data.append({"timestamp": ts, "data": rand})
    print(json.dumps(data, separators=",:"))


if __name__ == "__main__":
    main()
