import {
    FireReference
} from '../../futur-lib/data.js'
import * as firebase from 'firebase/app';
import 'firebase/functions';

export class Game extends FireReference {

    constructor(id) {
        super();
        this.id = id;
        this.initConnection();
    }

    get sources() {
        return {
            game: "games/" + this.id,
            elements: "elements/" + this.id,
            status: "status/" + this.id,
        };
    }
    get actions() {
        return {
            launchGame: async (key) => {
                const res = await firebase.functions().httpsCallable('launchGame')({key, scenario:"intro"});
            },

            playAction: (action) => {
                let actionnable = this.data.elements.find(cell => cell.id == action.elementId);
                actionnable.actions = actionnable.actions.filter(a=>a.id !== action.id)
                if(actionnable.plannedActions){
                    actionnable.plannedActions.push(action)
                }else{
                    actionnable.plannedActions = [action]
                }
                this.save();
            },
            cancelAction: (action) => {
                let actionnable = this.data.elements.find(cell => cell.id == action.elementId);
                actionnable.plannedActions = actionnable.plannedActions.filter(a=>a.id !== action.id);
                action.result = null
                if(actionnable.actions){
                    actionnable.actions.push(action)
                }else{
                    actionnable.actions = [action]
                }
                this.save();
            },
            validateTurn: async (key) => {
                const res = await firebase.functions().httpsCallable('validateTurn')(key);
            }
        }
    }

    formatDatas({ game, elements, status}) {
        let data = {
            elements: elements || [],
            players: game.players || [],
            gameInfo: game.gameInfo || {
                turn: 1,
                toPlay: 0,
                votes: 0
            },
            scenario: game.scenario || undefined,
            status,
            key:this.id,
        };
        return data;
    }

    presave({
        game,
        elements
    }) {
        let data = {
            game,
            elements
        };
        return data;
    }

    get defaultValues() {
        return {
            game: {
                loaded: false,
            },
            elements: [],
        };
    }
}