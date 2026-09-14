import Svg, { Path } from 'react-native-svg';

const S = 23;
const W = 1.7;

function Base({ color, children }: any) {
  return (
    <Svg width={S} height={S} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function HomeIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6.5H9V21H4a1 1 0 0 1-1-1z" />
    </Base>
  );
}

export function LoadsIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <Path d="M3.3 7 12 12l8.7-5" />
      <Path d="M12 22V12" />
    </Base>
  );
}

export function MapIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M2 6.5 8.5 4l7 2.5L22 4v13.5L15.5 20l-7-2.5L2 20z" />
      <Path d="M8.5 4v13.5" />
      <Path d="M15.5 6.5V20" />
    </Base>
  );
}

export function IncomeIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M12 2.5v19" />
      <Path d="M16.8 6H9.8a3.2 3.2 0 0 0 0 6.4h4.4a3.2 3.2 0 0 1 0 6.4H6.6" />
    </Base>
  );
}

export function ExpensesIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M5 2.5v19l2-1.4 2 1.4 2-1.4 2 1.4 2-1.4 2 1.4v-19l-2 1.4-2-1.4-2 1.4-2-1.4-2 1.4z" />
      <Path d="M9 8h6" />
      <Path d="M9 12h6" />
      <Path d="M9 16h4" />
    </Base>
  );
}
