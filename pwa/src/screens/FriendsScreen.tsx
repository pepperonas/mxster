/** Leute → Freunde: requests, search and the friends list (FriendsSection). */
import { PeopleHeader } from '@/shell/SectionHeaders'
import { FriendsSection } from './FriendsSection'

export function FriendsScreen() {
  return (
    <div className="pt-4 md:pt-10 pb-6">
      <PeopleHeader />
      <FriendsSection />
    </div>
  )
}
