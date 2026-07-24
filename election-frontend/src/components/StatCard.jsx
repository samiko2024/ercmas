export default function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h3 className="text-gray-500">{title}</h3>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}