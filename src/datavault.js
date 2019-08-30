import { Dao } from '../futur-lib/data.js'
import { VrgLogin } from './Entities/VrgLogin.js'
import { Game } from './Entities/Game.js'
import { News } from './Entities/News.js'

export default new Dao([
{
    name: 'News',
    classDef: News
},
{
    name: 'User',
    classDef: VrgLogin
},{
    name: 'Game',
    classDef: Game
},

]);