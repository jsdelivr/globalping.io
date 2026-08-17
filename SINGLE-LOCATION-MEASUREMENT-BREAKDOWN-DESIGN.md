# Single-location measurement breakdown

Status: decision-ready design; implementation is not authorized by this document.

Repository: `globalping.io`, legacy Ractive measurement results UI.

Research and product decisions completed: 2026-08-07.

## 1. Agreed product behavior

When a completed measurement has exactly one requested location, the UI may infer a geographic or network breakdown from the per-probe result values. The inference is deliberately conservative:

- Cluster result values first.
- Independently construct simple candidate partitions from probe metadata.
- Display a breakdown only when a value partition and a metadata partition contain exactly the same probe sets, apart from probes legitimately excluded by the coverage rules below.
- If no candidate passes every rule, display no inferred breakdown.

This is an explanation feature, not a general-purpose clustering explorer. A value pattern alone is insufficient, and a geographic pattern alone is insufficient.

### Eligibility

- Attempt inference only when the original measurement request contains exactly one requested location.
- All single-location forms are eligible: `World`, a continent, region, country, city, static selector, compound magic expression, ASN/network selector, or a previous measurement used to reselect probes.
- Do not reinterpret or validate the requested scope against returned probe metadata. The API guarantees that selected probes are within the requested scope.
- Wait until every target has reached a final state before attempting inference.
- Preserve the existing behavior unchanged for measurements with multiple explicitly requested locations.
- Require at least 10 selected probes in the measurement, including offline probes.

### Allowed grouping dimensions

Try these dimensions in this semantic priority order:

1. Continent
2. Region
3. Country
4. US state, only when every non-offline probe is in the United States
5. Network
6. ASN

Country, continent, region, and eligible state results use the title **Location breakdown**. Network results use **Network breakdown**. ASN results use **ASN breakdown**.

Do not use city, coordinates, tags, cloud regions, or combined dimensions in this phase. In particular, do not infer labels such as `Germany + ASN 123`.

### Allowed group shapes

- A complete partition by the atomic values of one dimension is allowed. This permits results such as `Asia`, `Europe`, and `Africa` when those sets exactly match the value clusters.
- A single atomic value versus its complement is allowed, for example `Germany` versus `Other locations` or one named network versus `Other networks`.
- Try the complete atomic partition before the one-versus-rest candidates for the same dimension.
- Do not create arbitrary unions, overlapping groups, or hand-built labels.
- Allow 2 to 6 displayed groups, including an `Other` group.
- Every probe participating in the candidate analysis must belong to exactly one displayed group.

For a two-network result, label the comparison explicitly with the two network names so it reads as “Network A versus Network B,” rather than presenting it as a geographic comparison. Use `Other locations`, `Other networks`, or `Other ASNs` for complements. Sort groups by descending probe count and then alphabetically by label.

### Targets and metrics

- Evaluate one target and one metric at a time; do not combine metrics into a mixed feature vector.
- A grouping only needs convincing evidence from one target. It does not need to reproduce across every target.
- Evaluate targets in their display order and metrics in the type-specific semantic order defined below.
- Stop at the first fully valid grouping. Use that grouping for the measurement breakdown; the other targets remain descriptive.
- Mark the supporting target/metric row with the existing notable-difference indicator. If the current component has no suitable indicator, the implementation phase must add an accessible **Notable difference** indicator.
- Do not reuse the red error treatment for a statistically notable but otherwise successful result.

### Offline probes and fallback

- Exclude offline probes from value clustering, geographic matching, and displayed inferred groups.
- Show one breakdown-level message such as `1 offline probe excluded` or `N offline probes excluded`.
- Count offline probes in the total sample and overall coverage denominator so weak evidence cannot be rescued merely by discarding a large offline fraction.
- If no grouping is defensible, render no inferred breakdown and no empty-state explanation.

## 2. API fields and repository integration points

The canonical contract is the [Globalping OpenAPI specification](https://api.globalping.io/v1/spec.yaml); the browser-oriented version is the [Globalping REST API documentation](https://globalping.io/docs/api.globalping.io).

### Probe metadata

Measurement results expose probe metadata including continent, region, country, state, city, network, ASN, coordinates, and tags. The selected design uses only continent, region, country, conditionally US state, network, and ASN.

The live probe inventory inspected during research contained roughly 4,800 probes. Geographic fields were much more consistently populated than network/ASN fields, so the coverage and exact-membership checks are important: network and ASN remain first-class candidates, but sparse metadata must not produce a partial or misleading group.

Do not use the single requested location returned in the measurement request as evidence for a subdivision. Only the per-probe metadata is relevant to interpreting value clusters.

### Per-probe result inventory

| Measurement | Available result values | Kind and caveats | Metrics used for inference |
| --- | --- | --- | --- |
| Ping | `stats.min`, `stats.avg`, `stats.max`, packet totals/drops/loss, individual RTT timings, result status | RTT/loss are numeric. Missing RTTs and timeouts are censored outcomes, not large latency values. | Outcome, packet loss, average latency |
| Traceroute | Result status and `resolvedAddress`; per-hop resolved address, timings/RTTs, and hop statistics | Hop timings are numeric; path and address values are categorical/structured. A final responding hop is useful only if the trace reached the resolved target. | Outcome, destination-hop average latency |
| MTR | Result status and `resolvedAddress`; per-hop min/avg/max/loss and timing information | Destination loss and latency are numeric. Intermediate hops are route diagnostics, not comparable end-result metrics for this feature. | Outcome, destination-hop packet loss, destination-hop average latency |
| DNS | Status code/name, answers, total time, result status; trace mode has hop results and a final query result | Status and answer presence are categorical; total time is numeric. No answers is distinct from timeout/failure. | Outcome, DNS status, answer presence, total time |
| HTTP | Status code/name, headers, total and phase timings, TLS data, result status | Exact status is categorical; total time and valid Content-Length are numeric. TLS and phase timings are available but intentionally excluded in this phase. | Outcome, HTTP status, total time, Content-Length |

`failureSource` is an optional/experimental API result field. Separate failed outcomes using it, with only these user-facing labels:

- `target` -> **Target error**
- `resolver` -> **Resolver error**
- `internal` -> **Internal error**
- absent or unknown -> **Error**

Use **Timed out** as its own outcome. Do not map timeouts to a large numeric value. An empty DNS answer set is **No answers**, not automatically an error. Offline is not an outcome cluster.

Raw output is available for every measurement type, but inference must use structured API fields only. Parsing command output would introduce format dependencies and inconsistent semantics.

### Traceroute observation

The supplied measurement `2ZvNJiYZOXcEcFIck00020u7v` was inspected during research. Its three probe results finished, but none of their traces reached the result's resolved target address. It therefore supplies three error outcomes, not three destination-latency values. This case is a required validation fixture.

For traceroute and MTR, compare the final responding hop's resolved address with the result's `resolvedAddress`. If the target was reached, use the final hop. If it was not reached, classify the result as **Error** and do not cluster the last intermediate-hop latency.

### Current repository behavior

- `src/views/components/measurement-breakdown.html:207` computes the breakdown. At line 213 it removes exact standalone `World`, and at line 215 it suppresses the component when at most one requested location remains.
- `src/views/pages/_index.html:683` mounts the component for the shared measurement results view.
- `src/views/pages/_index.html:4050` prepares each target's table/summary statistics. It currently carries DNS answer/status and HTTP total/status values, but it does not yet carry `failureSource`, HTTP Content-Length, or an explicit destination-reached flag.
- `src/views/pages/_index.html:4093` derives traceroute timing from the last hop without first proving that it is the destination.
- `src/views/components/results-controls.html:14` exposes table/list switching only for ping, even though the preparation path and breakdown serve every measurement type.
- `src/assets/less/components/measurement-breakdown.less:143` defines the current problem styling. Notable differences need a separate non-error presentation.

The pure clustering, scoring, candidate-search, and geographic-matching algorithm must live in a dedicated `src/assets/js/utils/measurement-breakdown-inference.js` module. Do not place or re-export that feature-specific logic through `src/assets/js/_.js`. The Ractive component should consume the module's deterministic result and render it; it should not own the statistical search. The preparation code in `src/views/pages/_index.html` is the integration point for adding structured per-probe fields. The component and its Less file remain the UI integration points.

The checked-in API schema dependency predates `failureSource`. During implementation, use the current live contract deliberately rather than assuming the installed schema already models the field.

## 3. Comparison of viable approaches

### Numerical clustering

| Technique | Assessment for this feature |
| --- | --- |
| Exact one-dimensional k-medians | **Selected.** L1 distance is robust to extreme values; the one-dimensional problem can be solved deterministically and exactly for the small `k` and `n <= 500` domain. Exact 1-D k-means/k-medians algorithms are established in the literature ([Grønlund et al.](https://arxiv.org/abs/1701.07204)). |
| K-means | Fast and familiar, but squared distance lets a few extreme latency values dominate boundaries and centers. |
| Jenks natural breaks | A useful 1-D partitioning method, but its within-class squared-deviation objective has the same outlier concern and does not itself solve `k` selection. |
| Agglomerative hierarchy | Produces a useful dendrogram, but still needs linkage and cut rules; common methods such as [Ward's method](https://doi.org/10.1080/01621459.1963.10500845) optimize squared error. It adds choices without a product benefit here. |
| DBSCAN | Finds dense regions without choosing `k`, but requires scale-sensitive epsilon/min-points parameters and may emit noise. Noise conflicts with the complete-partition requirement ([original DBSCAN paper](https://doi.org/10.5555/3001460.3001507)). |
| Gaussian mixtures | Gives probabilistic assignments and model-selection options, but adds distributional assumptions, initialization concerns, and more browser work than this small 1-D problem warrants. |
| Change-point or largest-gap rules | Cheap and deterministic, but a tail/outlier can create the largest gap. Meaningful multi-group selection still needs extra thresholds. |

Choose `k` from 2 through 6 by maximum mean silhouette width, with `k = 1` retained only as the conceptual no-breakdown baseline. Silhouette compares within-cluster cohesion with separation from the nearest other cluster ([Rousseeuw, 1987](https://doi.org/10.1016/0377-0427(87)90125-7)). It is a cheap internal quality measure for this bounded browser-side problem; it is not proof of geographic meaning.

The [gap statistic](https://doi.org/10.1111/1467-9868.00293) was considered but rejected because generating reference samples adds work and randomness without replacing the exact geographic-match gate.

### Distances and transformations

- For all time values, cluster `log1p(milliseconds)` with L1 distance. This tests the hypothesis that relative latency changes matter more at lower values: 20 -> 80 ms should count as more consequential than 800 -> 1000 ms despite the smaller absolute delta.
- Retain an additional absolute and relative effect-size gate in original milliseconds so tiny low-latency differences cannot pass solely because of the log transform.
- For HTTP Content-Length, use `log1p(bytes)` with L1 distance. Known zero-byte values are valid; missing or invalid headers are not zero.
- For packet loss, use the percentage directly with L1 distance. Do not turn each observed percentage into a category.
- Do not normalize metrics against one another because only one metric is considered at a time.

### Categorical and mixed results

Use exact equality partitions for outcome, DNS status, answer presence, and HTTP status. HTTP status codes remain exact categories; do not bucket them into 2xx/3xx/4xx/5xx families for inference.

If there are 2 to 6 categories, try the complete category partition. Then try deterministic one-category-versus-rest partitions where applicable. If there is only one category, there is no value split. If there are more than 6 categories, skip the full partition and consider one-versus-rest candidates only.

Mixed-distance methods such as [Gower distance](https://doi.org/10.2307/2528823) are unnecessary because the agreed design considers a single numeric or categorical metric at a time. This also makes the explanation traceable to one visible quality indicator.

### Geographic interpretation

The selected test is an exact set-partition match:

- Ignore cluster numbering and compare the two partitions as unordered sets of probe sets.
- Every value cluster must map to exactly one metadata group, and every metadata group must map to exactly one value cluster.
- For numeric metrics, values within a cluster need not be identical; the one-to-one rule applies to cluster membership.
- For one-versus-rest, the named metadata value and its complement must exactly reproduce the two value clusters.

This is effectively 100% purity and 100% bidirectional membership coverage on probes with a usable metric. Approximate measures such as purity, mutual information, or adjusted mutual information ([Vinh et al., 2010](https://jmlr.org/papers/v11/vinh10a.html)) are not used in this phase. Approximate matching would require another product-selected error tolerance and could display exceptions that are difficult to explain.

No unions-of-countries search, permutation significance test, resampling stability test, or multiple-testing correction is needed under the agreed conservative search. Complexity is controlled by semantic ordering, an eight-candidate cap, strong internal/effect thresholds, and the exact metadata correspondence. These are product choices, not general statistical claims.

## 4. Recommended staged decision process

For each completed measurement:

1. Read the original requested locations. If their count is not exactly one, use the existing explicit-location behavior and stop.
2. Wait until all targets are final.
3. Let `N` be all selected probes, including offline probes. If `N < 10`, stop.
4. Exclude offline probes from candidate membership and remember their count for the UI indicator.
5. Iterate targets in display order and the target type's metrics in the semantic order in section 6.
6. Build at most one best numeric value partition for a numeric metric, or deterministic exact partitions for a categorical metric.
7. Reject a value candidate unless it passes coverage, group-size, cluster-quality, and metric-specific effect thresholds.
8. For that value candidate, try metadata dimensions in the agreed priority order. Within each dimension, try the complete atomic partition, followed by deterministic one-versus-rest partitions.
9. Reject a metadata candidate if a participating probe lacks that dimension, if the displayed group count is outside 2..6, or if group-size/per-group coverage fails.
10. Compare the value and metadata partitions for exact one-to-one membership. If they match, accept immediately and stop the entire search.
11. Stop after eight value-partition candidates across all targets and metrics.
12. If nothing has matched, return no inferred grouping.

### Numeric partition details

1. Remove values that are offline, missing, failed, timed out, non-finite, or otherwise censored.
2. Transform the remaining values according to their metric.
3. Sort deterministically by transformed value, with a stable per-result key used only to resolve ties. Do not depend on current table sort order.
4. Solve exact 1-D k-medians for every feasible `k` from 2 through `min(6, usableValueCount)`.
5. Keep equal values together; a boundary may not split identical transformed values.
6. Discard solutions with undersized groups or insufficient effect size.
7. Compute mean silhouette using the same L1 distance. Select the highest score; ties choose smaller `k`, then the lexicographically earlier deterministic boundary sequence.
8. Require mean silhouette >= 0.70 before geographic matching.

### Categorical partition details

1. Preserve exact categories and assign all usable values.
2. Sort categories by descending probe count and then numerically or lexicographically by stable display value.
3. Try the full category partition when it contains 2..6 groups.
4. Then try each category versus all remaining categories, in that same deterministic order.
5. Apply total/group size and coverage gates, but do not compute silhouette for exact categorical partitions.

## 5. Thresholds, stopping rules, and fallback

| Rule | Agreed threshold |
| --- | --- |
| Minimum total sample | 10 selected probes, including offline probes |
| Minimum displayed group | `max(3, min(10, ceil(0.05 * N)))` probes |
| Overall usable-value coverage | At least 80% of `N`; offline probes remain in this denominator |
| Per-group usable-value coverage | At least 80% of non-offline probes assigned to that proposed metadata group |
| Geographic correspondence | Exact one-to-one membership on probes with usable values |
| Numeric `k` | 2..6; `k = 1` is the no-breakdown baseline only |
| Numeric silhouette | Mean >= 0.70 |
| Time effect size | Every adjacent cluster-median pair differs by at least 10 ms **and** at least 50% in original units |
| Packet-loss effect size | Every adjacent cluster-median pair differs by at least 10 percentage points |
| Content-Length effect size | Silhouette/coverage/group-size gates; no additional byte threshold was agreed |
| Displayed groups | 2..6, including `Other` |
| Search budget | At most 8 value-partition candidates; first full match wins |
| Runtime validation | At most 100 ms for the inference algorithm at the supported worst case |

For `N = 10`, the group minimum is 3. For `N = 100`, it is 5. For `N = 500`, it is capped at 10, preventing a three-probe tail from becoming a “group” without demanding 25 probes.

The 100 ms budget is a product ceiling, not a claim that 100 ms of main-thread work is ideal. The W3C Long Tasks API classifies work at 50 ms as a long task and relates this to a 100 ms response budget ([Long Tasks specification](https://www.w3.org/TR/longtasks-1/)). Validation should therefore also report the 50 ms long-task risk even though the agreed hard failure threshold is 100 ms.

Do not use a runtime timeout to make output nondeterministic. Bound work through the fixed input, `k`, dimension, group, and candidate limits. The fallback after any failed gate or exhausted search is the current no-breakdown state.

## 6. Measurement-type-specific handling

The ordering below is both semantic priority and a performance control. Stop at the first grouping that passes every gate.

### Common outcome metric

The first metric for every type is categorical outcome. Categories may include:

- **Success**
- **Timed out**
- **Target error**
- **Resolver error**
- **Internal error**
- **Error**

Do not manufacture a numeric value for any non-success outcome. Where a protocol has a structurally incomplete result, treat it as **Error** unless the API supplies a more specific failure source.

### Ping

Metric order:

1. Outcome, categorical
2. Packet loss, numeric percentage
3. Average latency, numeric milliseconds

Do not separately cluster min/max latency or individual packet RTTs. They remain descriptive summary values.

### Traceroute

Metric order:

1. Outcome, categorical
2. Destination-hop average latency, numeric milliseconds

A responding last hop is a success only when it reaches `resolvedAddress`; otherwise the result is **Error**. Do not infer from hop count, intermediate latency, route/address sequences, ASN path, or partial path structure.

### MTR

Metric order:

1. Outcome, categorical
2. Destination-hop packet loss, numeric percentage
3. Destination-hop average latency, numeric milliseconds

Use the same destination-reached rule as traceroute. Do not use intermediate-hop values, jitter, standard deviation, or min/max as separate clustering features.

### DNS

Metric order:

1. Outcome, categorical
2. DNS status, categorical exact status code/name
3. Answer presence, categorical **Answers** versus **No answers**
4. Total query time, numeric milliseconds

For ordinary DNS, use the top-level query result. For DNS trace, use the final query/hop that contains the completed DNS response. A valid `NOERROR` response with zero answers is **No answers**, not a timeout. An incomplete trace without a completed final response is **Error**. Skip status or time candidates when the corresponding structured field is absent rather than inventing a category/value.

### HTTP

Metric order:

1. Outcome, categorical
2. HTTP status, categorical exact numeric code
3. Total response time, numeric milliseconds
4. Content-Length, numeric bytes

Read Content-Length case-insensitively from structured headers. Accept only a consistent, non-negative integer value. Treat an explicitly known `0` as valid. Missing, malformed, negative, or conflicting values are missing and reduce coverage; do not infer body size from raw output.

Do not use DNS/connect/TLS/TTFB/download phase timings, TLS authorization/outcome, resolved address, or response-body content in this phase.

## 7. Edge cases and failure modes

- **One metadata value only:** a Netherlands-only sample in one network cannot create a comparison, regardless of value variation.
- **Strong value split, no exact geography:** reject it. Do not choose the “closest” country/network.
- **Strong geography, weak values:** reject it. Geography is explanatory evidence, not the source of the split.
- **Small isolated tail:** reject it through the dynamic group-size threshold; do not remove or reassign the outliers.
- **More than six atomic metadata groups:** skip the full partition, but one-versus-rest candidates remain eligible.
- **More than six categorical result values:** skip the full value partition, but one-category-versus-rest candidates remain eligible.
- **Uneven probe distribution:** do not weight countries or networks equally. Probe membership is the unit of evidence; the minimum size, coverage, and exact match rules prevent tiny groups from dominating.
- **Missing metadata:** reject that dimension if any probe participating in the value partition cannot be assigned. Continue with the next dimension.
- **Missing numeric values or failed results:** exclude them from that numeric metric only. They remain eligible for the earlier categorical outcome metric, and the 80% coverage gates limit their influence.
- **Multiple matching dimensions:** semantic dimension order decides; accept the first exact match.
- **Multiple targets:** evidence from one target is sufficient. Only the supporting target/metric receives the notable-difference marker.
- **Partial/in-progress measurements:** do not infer until every target is final.
- **Input reordering:** shuffling probe/result presentation must not change groups, labels, or the selected candidate.
- **Network/ASN sparsity:** expected to reject many network candidates; do not weaken metadata or value coverage to make them appear.
- **Experimental `failureSource`:** unknown/new values fall back to **Error** rather than creating new user-facing labels.
- **False discovery:** exact matching substantially limits accidental interpretations, but the accepted thresholds are product policy rather than a quantified population-level false-positive rate. The pre-release fixture evaluation is the guardrail.

## 8. Validation plan

Build and check in a reusable reference corpus of 100 immutable Globalping API response snapshots: 20 each for ping, traceroute, MTR, DNS, and HTTP. Save raw response JSON rather than measurement IDs alone because shared measurements expire; Globalping explicitly warns against hard-coding measurement IDs for reuse in its [official project guidance](https://github.com/jsdelivr/globalping#reselect-probes-).

Keep a manifest beside the snapshots containing the reviewed expected result for each case:

- breakdown expected or absent;
- winning target and metric;
- winning dimension and full versus one-rest shape;
- exact expected group labels and probe membership;
- offline count/indicator;
- expected title and notable-difference marker.

The corpus must cover:

- sample sizes from 10 through 500;
- World, continent, region, country, US-only state, compound magic, static selection, and reused-probe requests;
- balanced and severely unbalanced populations;
- 2-group and 3..6-group positive cases;
- strong non-geographic value clusters that must be rejected;
- exact geographic/network/ASN matches;
- timeouts, every approved `failureSource`, offline probes, missing values, no-answer DNS, malformed/missing Content-Length, and destination-not-reached traceroute/MTR;
- cases directly on both sides of every size, coverage, silhouette, and effect-size threshold;
- multi-target cases where only one target supports the selected grouping;
- the inspected traceroute measurement `2ZvNJiYZOXcEcFIck00020u7v` as a saved response, not only an ID.

Release gates:

1. **No misleading positives:** every displayed grouping matches the human-reviewed manifest exactly. One wrong grouping blocks release.
2. **Recorded omissions:** false negatives are recorded and reviewed. They do not automatically block release unless they reveal a systematic defect or contradict an agreed rule.
3. **Determinism:** repeat runs and shuffled input produce byte-equivalent decision output.
4. **Threshold correctness:** boundary fixtures pass/fail exactly as specified.
5. **Performance:** every supported worst-case snapshot completes the inference algorithm in <= 100 ms in the agreed browser/device test environment; also report executions over 50 ms.
6. **UI/accessibility:** titles, labels, `Other`, offline messaging, horizontal behavior, notable-difference semantics, and error semantics are correct in desktop and mobile rendering.

The snapshots and expected manifest make this a normal repeatable test corpus; the team does not need to fetch or manually re-review live measurements on every run.

## 9. Remaining questions and implementation boundary

There are no known blocking product, statistical, or algorithm-selection questions after the interview. Exact fixture directory names, helper signatures, and component data shapes are implementation details to determine from current repository conventions.

During implementation, investigate every uncertainty against the current repository, API contract, representative data, and authoritative sources first. If uncertainty remains about behavior, API interpretation, thresholds, labels, fallback behavior, architecture, performance tradeoffs, scope, or test expectations, pause and ask the user one consequential question at a time. Explain why the answer matters, recommend an answer, present concrete alternatives and tradeoffs, and wait before continuing dependent work. Do not let a coder or reviewer silently resolve such uncertainty. Routine mechanical choices may follow an unambiguous existing repository pattern.

If validation exposes a need to relax exact matching, alter thresholds, add dimensions/metric combinations, or change the first-match policy, stop and return for a new product decision. Do not tune those policies silently against the corpus.

This document does not authorize code changes. A separate implementation request must explicitly authorize editing the repository.
