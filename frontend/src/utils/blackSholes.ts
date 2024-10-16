export function blackScholes(
    callPutFlag: 'call' | 'put',
    S: number,  // Current price of the underlying asset (APT)
    X: number,  // Strike price
    T: number,  // Time to expiration in years
    r: number,  // Risk-free interest rate (e.g., 0.01 for 1%)
    v: number   // Volatility (e.g., 0.5 for 50%)
  ): number {
    const ln = Math.log;
    const sqrt = Math.sqrt;
    const exp = Math.exp;
    const pow = Math.pow;
  
    // Cumulative distribution function for the standard normal distribution
    function cdf(x: number): number {
      return (1 + erf(x / Math.SQRT2)) / 2;
    }
  
    // Error function approximation (Abramowitz and Stegun formula 7.1.26)
    function erf(x: number): number {
      const sign = x >= 0 ? 1 : -1;
      x = Math.abs(x);
  
      const a1 =  0.254829592;
      const a2 = -0.284496736;
      const a3 =  1.421413741;
      const a4 = -1.453152027;
      const a5 =  1.061405429;
      const p  =  0.3275911;
  
      const t = 1 / (1 + p * x);
      const y = 1 - ((((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t) * exp(-x * x);
  
      return sign * y;
    }
  
    const d1 = (ln(S / X) + (r + 0.5 * v * v) * T) / (v * sqrt(T));
    const d2 = d1 - v * sqrt(T);
  
    if (callPutFlag === 'call') {
      return S * cdf(d1) - X * exp(-r * T) * cdf(d2);
    } else {
      return X * exp(-r * T) * cdf(-d2) - S * cdf(-d1);
    }
  }