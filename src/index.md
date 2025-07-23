---
theme: dashboard
toc: false
---

# Focus Context

```js
const data = await FileAttachment("data/timestats.json").json();
data.forEach(d => {d.timestamp = new Date(d.timestamp)});
```

```js
import {FocusContextChart} from "./components/Chart.js";
```

<div class="card">
    ${resize((width) => FocusContextChart(data, width, "timestamp", ["data"]))}
</div>
