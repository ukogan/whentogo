# Risk Assessment - Airport Timing Advisor

## Critical Risks

### 1. **Data Quality & Availability** (HIGH)
**Risk:** Security time priors may not reflect actual TSA wait times
- **Impact:** Recommendations could be dangerously wrong (users miss flights) or overly conservative (users waste time)
- **Mitigation:**
  - Use conservative defaults (favor safety over efficiency)
  - Clearly label as "estimates based on typical conditions"
  - Phase 1: Use reasonable hardcoded priors
  - Phase 2: Integrate live MyTSA API data
- **Derisking:** Validate priors against published TSA data sources

### 2. **Lognormal Distribution Fit** (MEDIUM)
**Risk:** Min-max → lognormal parameter fitting may not accurately represent user's travel time distribution
- **Impact:** Incorrect quantile calculations lead to poor recommendations
- **Mitigation:**
  - Document assumptions clearly in UI
  - Use conservative fitting (±1.5σ approximation)
  - Provide wide recommendation ranges to hedge uncertainty
- **Derisking:** Test with simulated and real user data; compare to normal distribution alternative

### 3. **User Comprehension** (MEDIUM-HIGH)
**Risk:** Users may not understand the trade-off concept or trust the recommendations
- **Impact:** Low adoption, users revert to their current guessing strategies
- **Mitigation:**
  - Use emotional, non-technical language
  - Visualize confidence with airplane icons (not percentages)
  - Show "Earlier = safety, Later = efficiency" framing
  - Include explainer text
- **Derisking:** User testing with 5-10 travelers before launch

### 4. **Edge Cases** (MEDIUM)
**Risk:** Extreme inputs (e.g., 5 min travel, 180 min travel) break assumptions
- **Impact:** App crashes, nonsensical recommendations, negative times
- **Mitigation:**
  - Input validation (min/max bounds)
  - Graceful error handling
  - Cap distributions at reasonable bounds
- **Derisking:** Unit tests for edge cases, boundary value analysis

### 5. **Flight Time Validation** (LOW-MEDIUM)
**Risk:** User enters wrong flight time (AM/PM confusion, wrong timezone)
- **Impact:** Recommendation is correct for wrong flight time
- **Mitigation:**
  - Confirm flight time in multiple places
  - Show full date/time in results
  - Warning if flight is <2 hours away
- **Derisking:** Add confirmation step before final calculation

### 6. **Monte Carlo Variance** (LOW)
**Risk:** 10k samples may not be enough for tail quantiles (95th+ percentile)
- **Impact:** Unstable recommendations for risk-averse users
- **Mitigation:**
  - Use 10k samples (standard for this type of model)
  - Test variance across multiple runs
  - Consider increasing to 50k if needed
- **Derisking:** Run convergence tests on quantile stability

### 7. **Cost Coefficient Scaling** (LOW)
**Risk:** Base-3 exponential scaling may create too extreme differences
- **Impact:** Small dial changes cause dramatic recommendation shifts
- **Mitigation:**
  - Start with base-3 (1, 3, 9, 27, 81)
  - Monitor user feedback
  - Easy to adjust coefficient mapping
- **Derisking:** A/B test different scaling approaches (base-2, base-3, linear)

## Technical Risks

### 8. **Client-Side Performance** (LOW)
**Risk:** 10k Monte Carlo samples slow on older devices
- **Impact:** Laggy UX, users abandon during calculation
- **Mitigation:**
  - Modern devices handle 10k samples in <100ms
  - Add loading state during calculation
  - Consider Web Workers if needed
- **Derisking:** Performance testing on iPhone 11, Android mid-tier

### 9. **Browser Compatibility** (LOW)
**Risk:** Modern JS features not supported in older browsers
- **Impact:** App breaks for some users
- **Mitigation:**
  - Next.js transpiles for broad compatibility
  - Test in Safari, Chrome, Firefox
  - Graceful degradation
- **Derisking:** Test on iOS Safari 14+, Chrome 90+

### 10. **Railway Deployment** (LOW)
**Risk:** Deployment config issues, build failures
- **Impact:** Can't deploy or app crashes in production
- **Mitigation:**
  - Test build locally first
  - Use Nixpacks (Railway default)
  - Environment variable checks
- **Derisking:** Dry-run deployment to Railway staging

## Product Risks

### 11. **User Flow Complexity** (MEDIUM)
**Risk:** 3-step form feels too long, users drop off
- **Impact:** Low completion rate
- **Mitigation:**
  - Show progress bar
  - Allow back navigation
  - Each step is short (<1 min)
  - Consider "quick mode" in v1.1
- **Derisking:** Track completion funnel analytics (v1.1+)

### 12. **Lack of Personalization** (MEDIUM)
**Risk:** Users want to save preferences, see history
- **Impact:** Low retention, users don't return
- **Mitigation:**
  - v1 is stateless by design
  - v1.2 adds localStorage preferences
  - Focus v1 on core value prop
- **Derisking:** User interviews to validate stateless approach

### 13. **No Validation Against Reality** (HIGH)
**Risk:** No way to know if recommendations are actually good
- **Impact:** App could give bad advice and we wouldn't know
- **Mitigation:**
  - v1: Clearly label as beta/experimental
  - v2: Add "How did it go?" feedback loop
  - Track outcomes anonymously
- **Derisking:** Pilot with small group, collect qualitative feedback

## Risk Mitigation Priority

**Phase 1 (MVP - Current):**
1. ✅ Conservative security priors (Risk #1)
2. ✅ Input validation and error handling (Risk #4)
3. ✅ Clear, emotional UI language (Risk #3)
4. User testing with 5 travelers (Risk #3, #13)

**Phase 2 (v1.1):**
1. Live API integration (Risk #1)
2. Analytics funnel tracking (Risk #11)
3. Performance monitoring (Risk #8)

**Phase 3 (v2.0):**
1. Outcome validation loop (Risk #13)
2. Saved preferences (Risk #12)
3. Distribution alternative testing (Risk #2)

## Success Criteria for De-risking

- ✅ App runs without crashes for 10 test scenarios
- User test with ≥3 people shows ≥70% comprehension rate
- Recommendations for same inputs are stable (±2 min variance)
- Build deploys successfully to Railway
- ≥80% form completion rate in initial user testing
