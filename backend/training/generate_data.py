"""
CycleAura - Synthetic BBT data generator
Generates realistic BBT (Basal Body Temperature) data for model training
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta


def generate_cycle_bbt(cycle_length=28, base_temp=36.3, noise_level=0.1):
    """
    Generate BBT data for one menstrual cycle
    
    Args:
        cycle_length: Length of cycle in days (default 28)
        base_temp: Baseline temperature before ovulation
        noise_level: Random variation in temperature
    
    Returns:
        List of (day, temperature, phase) tuples
    """
    data = []
    
    # Typical cycle phase lengths
    menstrual_end = 5
    ovulation_day = cycle_length - 14  # Typically 14 days before next period
    luteal_start = ovulation_day + 1
    
    for day in range(1, cycle_length + 1):
        # Determine phase
        if day <= menstrual_end:
            phase = 'menstrual'
            temp = base_temp + np.random.normal(0, noise_level)
        elif day < ovulation_day:
            phase = 'follicular'
            temp = base_temp + np.random.normal(0, noise_level)
        elif day == ovulation_day:
            phase = 'ovulatory'
            # Temperature dip before ovulation
            temp = base_temp - 0.1 + np.random.normal(0, noise_level)
        else:
            phase = 'luteal'
            # Post-ovulation temperature rise (0.3-0.5°C higher)
            temp = base_temp + 0.4 + np.random.normal(0, noise_level)
        
        data.append({
            'day': day,
            'temperature': round(temp, 2),
            'phase': phase
        })
    
    return data


def generate_training_sample(window_size=7):
    """
    Generate a single training sample with a window of BBT readings
    
    Returns:
        Dictionary with day1-day7 temperatures and phase label
    """
    # Random cycle parameters
    cycle_length = np.random.randint(25, 35)
    base_temp = np.random.uniform(36.1, 36.5)
    noise = np.random.uniform(0.05, 0.15)
    
    cycle_data = generate_cycle_bbt(cycle_length, base_temp, noise)
    
    # Pick a random window
    start_day = np.random.randint(0, len(cycle_data) - window_size)
    window = cycle_data[start_day:start_day + window_size]
    
    # Use the phase of the last day in window as label
    sample = {f'day{i+1}': window[i]['temperature'] for i in range(window_size)}
    sample['phase'] = window[-1]['phase']
    
    return sample


def generate_training_sample_for_phase(target_phase, window_size=7):
    """
    Generate a training sample specifically for a target phase
    """
    max_attempts = 100
    for _ in range(max_attempts):
        cycle_length = np.random.randint(25, 35)
        base_temp = np.random.uniform(36.1, 36.5)
        noise = np.random.uniform(0.05, 0.15)
        
        cycle_data = generate_cycle_bbt(cycle_length, base_temp, noise)
        
        # For menstrual phase, we need to look at beginning of cycle
        # Use a smaller effective window for labeling
        valid_starts = []
        for start_day in range(max(0, len(cycle_data) - window_size)):
            end_day = start_day + window_size - 1
            if end_day < len(cycle_data) and cycle_data[end_day]['phase'] == target_phase:
                valid_starts.append(start_day)
        
        if valid_starts:
            start_day = np.random.choice(valid_starts)
            window = cycle_data[start_day:start_day + window_size]
            sample = {f'day{i+1}': window[i]['temperature'] for i in range(window_size)}
            sample['phase'] = target_phase
            return sample
        
        # For menstrual, also try wrapping around from previous cycle
        if target_phase == 'menstrual':
            # Simulate end of previous cycle + start of new cycle
            prev_cycle = generate_cycle_bbt(cycle_length, base_temp, noise)
            combined = prev_cycle[-4:] + cycle_data[:5]  # Last 4 days + first 5 days
            for start_day in range(len(combined) - window_size + 1):
                window = combined[start_day:start_day + window_size]
                if window[-1]['phase'] == 'menstrual':
                    sample = {f'day{i+1}': window[i]['temperature'] for i in range(window_size)}
                    sample['phase'] = 'menstrual'
                    return sample
    
    return None


def generate_dataset(output_path='bbt_dataset.csv', n_samples=1000, window_size=7):
    """
    Generate a complete training dataset
    
    Args:
        output_path: Path to save CSV file
        n_samples: Number of training samples to generate
        window_size: Number of days in each sample window
    """
    print(f"Generating {n_samples} training samples...")
    
    samples = []
    phase_counts = {'menstrual': 0, 'follicular': 0, 'ovulatory': 0, 'luteal': 0}
    
    # Generate balanced dataset
    samples_per_phase = n_samples // 4
    
    for phase in ['menstrual', 'follicular', 'ovulatory', 'luteal']:
        for _ in range(samples_per_phase):
            sample = generate_training_sample_for_phase(phase, window_size)
            if sample:
                samples.append(sample)
                phase_counts[phase] += 1
    
    # Shuffle samples
    np.random.shuffle(samples)
    
    # Create DataFrame and save
    df = pd.DataFrame(samples)
    df.to_csv(output_path, index=False)
    
    print(f"Dataset saved to {output_path}")
    print(f"Sample distribution: {phase_counts}")
    print(f"Total samples: {len(df)}")
    
    return df


def main():
    """Generate training dataset"""
    generate_dataset('bbt_dataset.csv', n_samples=2000)


if __name__ == '__main__':
    main()
