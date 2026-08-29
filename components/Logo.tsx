import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Polygon, Defs, LinearGradient, Stop } from 'react-native-svg';

const s = StyleSheet.create({
  wrap: { alignItems: 'flex-end' },
  driver: { color: '#9CA3AF', fontSize: 11, fontWeight: '400', letterSpacing: 3, marginTop: 2, marginRight: 2 },
});

export default function Logo({ height = 22, showDriver = true }) {
  const w = height * 3.2;

  return (
    <View style={s.wrap}>
      <Svg width={w} height={height} viewBox="0 0 96 30">
        <Defs>
          <LinearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F59E0B" />
            <Stop offset="1" stopColor="#D97706" />
          </LinearGradient>
        </Defs>

        {/* A — two strokes, no crossbar */}
        <Path d="M14 2 L2 28" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="square" />
        <Path d="M14 2 L26 28" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="square" />

        {/* inner triangle */}
        <Polygon points="14,15 20,28 8,28" fill="url(#g)" />

        {/* R */}
        <Path
          d="M40 28 L40 2 L50 2 A7 7 0 0 1 50 16 L40 16 M50 16 L58 28"
          stroke="#FFFFFF"
          strokeWidth="2"
          fill="none"
          strokeLinecap="square"
        />

        {/* K */}
        <Path d="M70 2 L70 28" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="square" />
        <Path d="M86 2 L70 17" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="square" />
        <Path d="M76 12 L88 28" stroke="#FFFFFF" strokeWidth="2" fill="none" strokeLinecap="square" />
      </Svg>

      {showDriver ? <Text style={s.driver}>driver</Text> : null}
    </View>
  );
}
