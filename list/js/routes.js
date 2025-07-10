import List from 'https://freegd.vercel.app/list/js/pages/List.js';
import Leaderboard from 'https://freegd.vercel.app/list/js/pages/Leaderboard.js';
import Roulette from 'https://freegd.vercel.app/list/js/pages/Roulette.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/roulette', component: Roulette },
];
