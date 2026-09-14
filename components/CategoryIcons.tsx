import Svg, { Path } from 'react-native-svg';

function Base({ color, size = 26, children }: any) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </Svg>
  );
}

export function RepairIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z" />
    </Base>
  );
}

export function FoodIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <Path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
      <Path d="M6 1v3M10 1v3M14 1v3" />
    </Base>
  );
}

export function ParkingIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <Path d="M9.5 17.5V7h3.2a3 3 0 0 1 0 6H9.5" />
    </Base>
  );
}

export function FuelIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M2.5 22h12" />
      <Path d="M4 22V4a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v18" />
      <Path d="M4 9.5h9" />
      <Path d="M13 8h2.5a2 2 0 0 1 2 2v6.3a1.9 1.9 0 0 0 3.8 0V9l-2.6-2.6" />
    </Base>
  );
}

export function OtherIcon({ color }: { color: string }) {
  return (
    <Base color={color}>
      <Path d="M20.6 13.4 12.4 5.2A2 2 0 0 0 11 4.6H5a1 1 0 0 0-1 1v6a2 2 0 0 0 .6 1.4l8.2 8.2a2 2 0 0 0 2.8 0l5-5a2 2 0 0 0 0-2.8z" />
      <Path d="M7.6 8.6h.01" />
    </Base>
  );
}
