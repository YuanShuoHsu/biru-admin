"use client";

interface PersonProps {
  color: string;
}

const Person = ({ color }: PersonProps) => (
  <>
    <mesh position-y={0.75}>
      <capsuleGeometry args={[0.2, 1.1, 4, 12]} />
      <meshStandardMaterial color={color} />
    </mesh>
    <mesh position-y={1.58}>
      <sphereGeometry args={[0.12]} />
      <meshStandardMaterial color={color} />
    </mesh>
  </>
);

export default Person;
