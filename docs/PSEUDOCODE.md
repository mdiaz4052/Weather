# Workflow pseudocode

Illustrative, not executable application code. Names correspond to `ARCHITECTURE.md`; shared interfaces are sketches in `packages/contracts/`. Apply source-specific rules from `SCIENCE.md` before numerical operations.

## Query planning and preparation

```python
def plan(request):
    selection = validate_quantity_statistic_calendar_and_bounds(request)
    adapter = registry.require_implemented(selection.dataset_id)
    availability = adapter.discover(selection)  # real coverage, not a static "present"
    require_supported_capabilities(selection, adapter, availability)
    require_access_and_terms(selection.dataset_id)  # never put a token in the plan
    source_assets = resolve_retained_snapshot_or_discover_asset_identities(selection)
    transforms = resolve_explicit_transforms_and_baseline(selection, source_assets)
    estimate = adapter.estimate(selection, source_assets, transforms)
    require_finite_bounded_request(estimate, selection)
    frozen = canonical_plan(selection, source_assets, transforms, estimate)
    # If discovery cannot identify stable input content yet, this is a draft.
    # Resolve its actual checksums and mint a new immutable execution plan after acquisition.
    return persist_draft_or_immutable_plan(frozen)

def prepare(plan_id):
    plan = load_valid_plan(plan_id)
    with metadata_transaction():
        lease = reserve_peak_disk_and_acquire_job_leases(plan)
        job = enqueue_once(plan.identity, lease)
    return accepted(job.id)

def run_job(job):
    try:
        for asset in job.required_assets:
            if cancellation_requested(job) and no_other_subscribers(job):
                raise Canceled()
            enforce_host_redirect_archive_and_byte_limits(asset)
            temporary = adapter.acquire(asset, resume_if_valid=True)
            validate_container_checksum_scientific_metadata(temporary)
            publish_source_atomically(temporary)
        snapshot = freeze_actual_inputs_and_adapter_version(job)
        field = adapter.normalize(snapshot, job.selection)
        require_supported_units_time_bounds_grid_and_masks(field)
        result = apply_recorded_transforms(field, job.transforms)
        validate_expected_shape_completeness_and_sample_checks(result)
        execution_plan = freeze_execution_plan(snapshot, job.selection, job.transforms)
        prepare_first_display_frames(result, execution_plan)
        publish_ready_manifest_atomically(execution_plan)
        mark_ready(job, execution_plan.id)
    except Canceled:
        mark_canceled_and_clean_only_owned_partials(job)
    except RetryableProviderFailure as failure:
        bounded_backoff_or_mark_failed(job, failure, honor_retry_after=True)
    except Exception as failure:
        mark_failed_with_redacted_diagnostic(job, failure)
    finally:
        release_unused_reservations_and_leases(job)
```

An immutable scientific plan must reference actual input identities. Draft provider requests are not retrospectively edited to look like immutable plans; return the execution plan ID when preparation resolves them. A saved view references the execution plan. Provider changes during retrieval require a new snapshot or a failed consistency check.

## Daily, hourly and monthly are real products

```python
def temporal_product(native, selection):
    if selection.statistic == native.statistic and selection.support == native.support:
        return preserve_provider_product_and_quality(native)
    if selection.support == "hourly" and native.support == "daily":
        raise Unsupported("A daily statistic cannot create hourly observations")
    require_product_specific_aggregation_rule(native, selection)
    groups = group_native_intervals_by_requested_calendar_and_day_convention(native)
    if is_temperature_mean(selection):
        return duration_or_documented_sampling_weighted_means(groups, coverage_policy)
    if is_precipitation_total(selection):
        return integrate_rate_or_sum_accumulations_after_resolving_resets(groups)
    raise Unsupported("No validated transform for this quantity/statistic")
```

## Point extraction and explanation

```python
def sample(plan, frame, requested_point):
    field = require_normalized_scientific_field(plan, frame)
    point = validate_and_normalize_longitude(requested_point)
    if outside_domain_mask(field, point):
        return null_value(status="not_applicable", provenance=field.provenance)
    cell = nearest_eligible_native_cell_with_explicit_tie_policy(field, point)
    value, quality = read_cell(field, cell)
    return value_or_null_with_status(
        value, quality, cell.bounds, cell.center, distance(point, cell.center),
        selection_method="nearest_native_cell", time_support=frame.bounds,
        units=field.units, provenance=field.provenance,
    )
```

Sampling an explicitly coarsened analysis field must identify that analysis grid instead of falsely claiming native-cell extraction. Missing native coverage is preserved.

## Playback coherence

```typescript
async function seek(frameId) {
  const generation = ++selectionGeneration;
  abortSupersededBrowserRequests();
  setLoading(frameId); // displayed date remains tied to displayed field
  const frame = await loadPreparedFrame(activeExecutionPlan, frameId);
  if (generation !== selectionGeneration) return;
  const handle = await map.prepareFrame(frame);
  if (generation !== selectionGeneration) {
    map.discardFrame(handle);
    return;
  }
  // This commit swaps the field and its date/legend as one visible transition.
  map.commitFrame(handle);
  setDisplayedFrameAndLegend(frame);
  prefetchWithinByteBudget(adjacentFrames(frame), activeExecutionPlan);
}
```

## Cache admission

```python
with storage_lock():
    peak = estimate_download_extraction_normalization_and_display_overlap(job)
    reclaim_unpinned_unleased_cache_if_needed(peak)
    if managed_used + reserved + peak > managed_cap:
        raise InsufficientStorage(smaller_window_suggestions(job))
    if filesystem_free - reserved - peak < minimum_free:
        raise InsufficientStorage("Free disk headroom would be exceeded")
    reserve(job.id, peak)
```

Never treat user-provided paths as deletion instructions. Cleanup uses catalogued asset IDs and resolved paths checked against the managed data root.
