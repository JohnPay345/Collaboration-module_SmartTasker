import { log } from './botHelpers.js';

/**
 * Сбор метрик: время отклика (мс) и пропускная способность (событий/с).
 * Пропускная способность считается по секундным окнам за время теста.
 */
export class MetricsCollector {
  /**
   * @param {string} label
   */
  constructor(label) {
    this.label = label;
    /** @type {number[]} */
    this.latenciesMs = [];
    /** @type {Map<number, number>} секунда Unix → число событий */
    this.eventsBySecond = new Map();
    this.startedAt = Date.now();
    this.endedAt = this.startedAt;
  }

  /** @param {number} ms */
  recordLatency(ms) {
    if (!Number.isFinite(ms) || ms < 0 || ms > 120_000) return;
    this.latenciesMs.push(ms);
  }

  /** @param {number} [at] timestamp ms */
  recordEvent(at = Date.now()) {
    this.endedAt = at;
    const sec = Math.floor(at / 1000);
    this.eventsBySecond.set(sec, (this.eventsBySecond.get(sec) ?? 0) + 1);
  }

  finish(at = Date.now()) {
    this.endedAt = at;
  }

  getLatencyStats() {
    const n = this.latenciesMs.length;
    if (!n) {
      return { count: 0, min: null, max: null, avg: null, p95: null };
    }
    const sorted = [...this.latenciesMs].sort((a, b) => a - b);
    const sum = sorted.reduce((s, v) => s + v, 0);
    const p95Idx = Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1);
    return {
      count: n,
      min: round(sorted[0]),
      max: round(sorted[sorted.length - 1]),
      avg: round(sum / n),
      p95: round(sorted[p95Idx]),
    };
  }

  getThroughputStats() {
    const rates = [...this.eventsBySecond.values()];
    const durationSec = Math.max(1, (this.endedAt - this.startedAt) / 1000);
    const totalEvents = rates.reduce((s, v) => s + v, 0);

    if (!rates.length) {
      return {
        windows: 0,
        totalEvents: 0,
        overallAvg: 0,
        min: null,
        max: null,
        avg: null,
      };
    }

    return {
      windows: rates.length,
      totalEvents,
      overallAvg: round(totalEvents / durationSec),
      min: round(Math.min(...rates)),
      max: round(Math.max(...rates)),
      avg: round(rates.reduce((s, v) => s + v, 0) / rates.length),
    };
  }

  getSummary() {
    return {
      label: this.label,
      durationSec: round((this.endedAt - this.startedAt) / 1000),
      latency: this.getLatencyStats(),
      throughput: this.getThroughputStats(),
    };
  }

  printReport(extraLines = []) {
    const s = this.getSummary();
    const lat = s.latency;
    const tp = s.throughput;

    console.log('');
    console.log(`══════════ Метрики: ${s.label} ══════════`);
    console.log(`Длительность теста: ${s.durationSec} с`);
    console.log('');
    console.log('Время отклика (мс):');
    if (lat.count === 0) {
      console.log('  нет измерений');
    } else {
      console.log(`  мин: ${lat.min}  |  макс: ${lat.max}  |  сред: ${lat.avg}  |  p95: ${lat.p95}  (n=${lat.count})`);
    }
    console.log('');
    console.log('Пропускная способность (событий/с, по секундным окнам):');
    if (tp.windows === 0) {
      console.log('  нет событий');
    } else {
      console.log(`  мин: ${tp.min}  |  макс: ${tp.max}  |  сред: ${tp.avg}  |  всего: ${tp.totalEvents}  (окон: ${tp.windows})`);
      console.log(`  средняя за весь тест: ${tp.overallAvg} событий/с`);
    }
    for (const line of extraLines) {
      console.log(line);
    }
    console.log('════════════════════════════════════════');
    console.log('');
  }
}

/** @param {MetricsCollector[]} collectors */
export function printCombinedReport(title, collectors, extraLines = []) {
  console.log('');
  console.log(`╔══════════ ${title} ══════════╗`);

  for (const c of collectors) {
    const s = c.getSummary();
    const lat = s.latency;
    const tp = s.throughput;
    console.log(`│ ${s.label} (${s.durationSec} с)`);
    if (lat.count) {
      console.log(`│   отклик мс — мин: ${lat.min}, макс: ${lat.max}, сред: ${lat.avg}, p95: ${lat.p95}`);
    } else {
      console.log('│   отклик — нет данных');
    }
    if (tp.windows) {
      console.log(`│   пропускная способность/с — мин: ${tp.min}, макс: ${tp.max}, сред: ${tp.avg} (всего ${tp.totalEvents})`);
    } else {
      console.log('│   пропускная способность — нет данных');
    }
  }

  for (const line of extraLines) {
    console.log(`│ ${line}`);
  }
  console.log('╚════════════════════════════════════════╝');
  console.log('');
}

function round(n) {
  return Math.round(n * 100) / 100;
}

/**
 * @param {MetricsCollector} collector
 * @param {string} section
 */
export function logMetricSnapshot(collector, section) {
  const lat = collector.getLatencyStats();
  const tp = collector.getThroughputStats();
  log('metrics', `${section}: отклик avg=${lat.avg ?? '—'}ms, пропускная способность avg=${tp.avg ?? '—'}/с`);
}
