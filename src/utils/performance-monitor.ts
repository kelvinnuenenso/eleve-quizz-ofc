/**
 * Performance Monitoring Utilities
 * Monitora métricas de performance em tempo real
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window === 'undefined') {
      this.isEnabled = false;
      return;
    }

    // Só habilitar em desenvolvimento ou staging
    this.isEnabled = import.meta.env.DEV || window.location.hostname.includes('staging');
  }

  /**
   * Registra uma métrica de performance
   */
  recordMetric(name: string, value: number) {
    if (!this.isEnabled) return;

    const rating = this.getRating(name, value);
    const metric: PerformanceMetric = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      const emoji = rating === 'good' ? '✅' : rating === 'needs-improvement' ? '⚠️' : '❌';
      console.log(`${emoji} ${name}: ${value.toFixed(2)}ms (${rating})`);
    }

    // Limitar histórico a 100 métricas
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Determina o rating baseado em thresholds do Web Vitals
   */
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      CLS: { good: 0.1, poor: 0.25 },
      TTFB: { good: 800, poor: 1800 },
      TTI: { good: 3500, poor: 7000 },
    };

    const threshold = thresholds[name];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Medir tempo de execução de uma função
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name} (error)`, duration);
      throw error;
    }
  }

  /**
   * Medir tempo de execução síncrona
   */
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.recordMetric(name, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.recordMetric(`${name} (error)`, duration);
      throw error;
    }
  }

  /**
   * Obter Web Vitals (opcional - requer instalação de web-vitals)
   */
  async getWebVitals() {
    if (!this.isEnabled) return;

    try {
      // Web Vitals é opcional - instalar com: npm install web-vitals
      // const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      // getCLS((metric) => this.recordMetric('CLS', metric.value));
      // getFID((metric) => this.recordMetric('FID', metric.value));
      // getFCP((metric) => this.recordMetric('FCP', metric.value));
      // getLCP((metric) => this.recordMetric('LCP', metric.value));
      // getTTFB((metric) => this.recordMetric('TTFB', metric.value));
      
      console.log('📊 Para usar Web Vitals, instale: npm install web-vitals');
    } catch (error) {
      console.warn('Web Vitals não disponível:', error);
    }
  }

  /**
   * Obter resumo de métricas
   */
  getSummary() {
    if (!this.isEnabled || this.metrics.length === 0) {
      return null;
    }

    const summary = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          ratings: { good: 0, 'needs-improvement': 0, poor: 0 },
        };
      }

      const s = acc[metric.name];
      s.count++;
      s.total += metric.value;
      s.min = Math.min(s.min, metric.value);
      s.max = Math.max(s.max, metric.value);
      s.ratings[metric.rating]++;

      return acc;
    }, {} as Record<string, any>);

    // Calcular médias
    Object.keys(summary).forEach((key) => {
      summary[key].average = summary[key].total / summary[key].count;
    });

    return summary;
  }

  /**
   * Exibir resumo no console
   */
  printSummary() {
    const summary = this.getSummary();
    if (!summary) return;

    console.group('📊 Performance Summary');
    Object.entries(summary).forEach(([name, data]: [string, any]) => {
      console.log(`\n${name}:`);
      console.log(`  Average: ${data.average.toFixed(2)}ms`);
      console.log(`  Min: ${data.min.toFixed(2)}ms`);
      console.log(`  Max: ${data.max.toFixed(2)}ms`);
      console.log(`  Ratings: ✅ ${data.ratings.good} | ⚠️ ${data.ratings['needs-improvement']} | ❌ ${data.ratings.poor}`);
    });
    console.groupEnd();
  }

  /**
   * Limpar métricas
   */
  clear() {
    this.metrics = [];
  }
}

// Instância singleton
export const performanceMonitor = new PerformanceMonitor();

// Expor globalmente em dev
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
  console.log('💡 Performance Monitor disponível: window.performanceMonitor');
}
