module OptionX::pricing {
    use aptos_std::fixed_point64::{self, FixedPoint64};
    use OptionX::constants;

    /// Error codes
    const E_INVALID_OPTION_TYPE: u64 = 1;

    /// Calculates the option price using the Black-Scholes model.
    /// 
    /// # Parameters
    /// - `underlying_price`: The current price of the underlying asset.
    /// - `strike_price`: The strike price of the option.
    /// - `time_to_expiry`: Time to expiration in seconds.
    /// - `volatility`: The volatility of the underlying asset (as a decimal, e.g., 0.2 for 20%).
    /// - `risk_free_rate`: The risk-free interest rate (as a decimal, e.g., 0.05 for 5%).
    /// - `option_type`: The type of the option (0 for Call, 1 for Put).
    /// 
    /// # Returns
    /// The option price as a `FixedPoint64`.
    public fun calculate_option_price(
        underlying_price: FixedPoint64,
        strike_price: FixedPoint64,
        time_to_expiry: u64,    // In seconds
        volatility: FixedPoint64,
        risk_free_rate: FixedPoint64,
        option_type: u8         // 0 for Call, 1 for Put
    ): FixedPoint64 {
        // Ensure valid option type
        if (option_type != 0 && option_type != 1) {
            abort E_INVALID_OPTION_TYPE;
        };

        // Convert time to expiry from seconds to years
        let time_in_years = fixed_point64::div(
            &fixed_point64::from_u64(time_to_expiry),
            &fixed_point64::from_u64(constants::SECONDS_IN_YEAR)
        );

        // Calculate d1 and d2
        let sqrt_time = fixed_point64::sqrt(&time_in_years);

        let d1 = fixed_point64::div(
            &fixed_point64::add(
                &fixed_point64::ln(&fixed_point64::div(&underlying_price, &strike_price)),
                &fixed_point64::mul(
                    &fixed_point64::add(
                        &risk_free_rate,
                        &fixed_point64::div(
                            &fixed_point64::mul(&volatility, &volatility),
                            &fixed_point64::from_u64(2)
                        )
                    ),
                    &time_in_years
                )
            ),
            &fixed_point64::mul(&volatility, &sqrt_time)
        );

        let d2 = fixed_point64::sub(
            &d1,
            &fixed_point64::mul(&volatility, &sqrt_time)
        );

        // Use a simplified approximation for N(d1) and N(d2)
        let nd1 = approximate_normal_cdf(&d1);
        let nd2 = approximate_normal_cdf(&d2);

        // Compute option price
        if (option_type == 0) { // Call option
            let price = fixed_point64::sub(
                &fixed_point64::mul(&underlying_price, &nd1),
                &fixed_point64::mul(
                    &strike_price,
                    &fixed_point64::mul(
                        &fixed_point64::exp(
                            &fixed_point64::neg(&fixed_point64::mul(&risk_free_rate, &time_in_years))
                        ),
                        &nd2
                    )
                )
            );
            price
        } else { // Put option
            let price = fixed_point64::sub(
                &fixed_point64::mul(
                    &strike_price,
                    &fixed_point64::mul(
                        &fixed_point64::exp(
                            &fixed_point64::neg(&fixed_point64::mul(&risk_free_rate, &time_in_years))
                        ),
                        &fixed_point64::sub(&fixed_point64::from_u64(1), &nd2)
                    )
                ),
                &fixed_point64::mul(
                    &underlying_price,
                    &fixed_point64::sub(&fixed_point64::from_u64(1), &nd1)
                )
            );
            price
        }
    }

    /// Approximates the cumulative distribution function for a standard normal distribution.
    /// 
    /// # Parameters
    /// - `x`: The value to evaluate the CDF at.
    /// 
    /// # Returns
    /// An approximate probability as a `FixedPoint64`.
    fun approximate_normal_cdf(x: &FixedPoint64): FixedPoint64 {
        // Simplified approximation using a linear function
        // N(x) ≈ 0.5 * (1 + x / (1 + abs(x)))
        let abs_x = fixed_point64::abs(x);
        let denom = fixed_point64::add(&fixed_point64::from_u64(1), &abs_x);
        let frac = fixed_point64::div(x, &denom);
        let result = fixed_point64::mul(&fixed_point64::from_num(0.5), &fixed_point64::add(&fixed_point64::from_u64(1), &frac));
        // Clamp the result between 0 and 1
        if (fixed_point64::lt(&result, &fixed_point64::zero())) {
            fixed_point64::zero()
        } else if (fixed_point64::gt(&result, &fixed_point64::from_u64(1))) {
            fixed_point64::from_u64(1)
        } else {
            result
        }
    }
}