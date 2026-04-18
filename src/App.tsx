import { Onboarding } from '@/screens/Onboarding'

export default function App() {
  return (
    <div className="min-h-screen bg-[#1f2025] flex items-center justify-center">
      <div className="w-full max-w-[430px] min-h-screen bg-background relative overflow-x-hidden">
        <Onboarding onStart={() => console.log('start')} />
      </div>
    </div>
  )
}
