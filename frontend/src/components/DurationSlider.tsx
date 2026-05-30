import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, type LayoutChangeEvent } from 'react-native';
import { MainColors, TextColors } from '@/constants';

type DurationSliderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  unitLabel?: string;
};

export const DurationSlider: React.FC<DurationSliderProps> = ({
  value,
  min = 1,
  max = 40,
  step = 1,
  onChange,
  disabled = false,
  unitLabel = 'ч',
}) => {
  const trackWidthRef = useRef(0);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const clamp = (raw: number) => {
    const stepped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, stepped));
  };

  const updateFromX = (x: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const ratio = Math.min(1, Math.max(0, x / w));
    const next = clamp(min + ratio * (max - min));
    onChange(next);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: (evt) => updateFromX(evt.nativeEvent.locationX),
        onPanResponderMove: (evt) => updateFromX(evt.nativeEvent.locationX),
      }),
    [disabled, min, max, step]
  );

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setLayoutWidth(w);
  };

  const ratio = (clamp(value) - min) / (max - min || 1);
  const thumbLeft = layoutWidth > 0 ? ratio * layoutWidth : 0;
  const fillPercent = `${ratio * 100}%`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.valueText}>
        {value} {unitLabel}
      </Text>
      <View
        style={[styles.track, disabled && styles.trackDisabled]}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: fillPercent }]} />
        <View style={[styles.thumb, { left: Math.max(0, thumbLeft - 10) }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.edgeLabel}>{min} {unitLabel}</Text>
        <Text style={styles.edgeLabel}>{max} {unitLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
  },
  valueText: {
    fontSize: 14,
    color: TextColors.dire_wolf,
    fontFamily: 'Century-Regular',
    marginBottom: 8,
    textAlign: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: MainColors.pixel_white,
    justifyContent: 'center',
  },
  trackDisabled: {
    opacity: 0.5,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: MainColors.pool_water,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: MainColors.herbery_honey,
    borderWidth: 2,
    borderColor: MainColors.pool_water,
    top: -6,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  edgeLabel: {
    fontSize: 11,
    color: TextColors.dim_gray,
    fontFamily: 'Century-Regular',
  },
});
