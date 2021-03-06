import { useEffect } from 'react';
import { useQuery } from 'react-query';
import { useHistory, useParams } from 'react-router-dom';

import { getUserDataByUsername } from 'services/firebase';
import { UserProfile } from 'components/profile';

function Profile() {
  const history = useHistory();
  const { username } = useParams();

  const { data: user } = useQuery({
    queryKey: ['profile', username],
    queryFn: () => getUserDataByUsername(username),
    onError() {
      history.push('/not-found');
    },
  });

  useEffect(() => {
    if (user) {
      document.title = `${user.userInfo.fullName} (@${user.username}) - Mrugjal profile`;
    }
  }, [user]);

  return (
    <div className="bg-gray-background">
      <div className="container mx-auto max-w-screen-lg px-3">
        <UserProfile profile={user} />
      </div>
    </div>
  );
}

export { Profile };
