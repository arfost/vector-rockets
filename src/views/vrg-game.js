import { html, css } from 'lit-element';
import { VrgBase } from '../vrg-base.js';
import Datavault from '../datavault.js';
import MapRenderer from '../drawMapUtils.js'

import '../components/game-popin.js';
import  '../components/btn-loader.js';
import '../components/game-components/vrg-touchpad.js'
import '../components/game-components/vrg-element-desc.js'
import '../components/game-components/vrg-game-info.js'
class VrgGame extends VrgBase {

    constructor(){
        super();
        this.game = {
            status:"loading"
        }
    }

    get selfStyles() {
        return css`
        .map {
            width:75vw;
            height:95vh;
            box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
            background-color:white;
            background-position: center;
            background-repeat: no-repeat;
            background-size: 100% 100%; 
        }

        .map > canvas{
            width:100%;
            height:100%;
        }
        
        .self {
            text-decoration: underline
        }
        .tooltip {
            position:fixed;
            bottom:1vh;
            left:1vh;
            z-index:200;
        }
        
        .controler{
            position:absolute;
            top:1em;
            right:2em;
        }`
    }

    static get properties() {
        return {
            user: Object,
            game: Object,
            selectedHexElements:Object,
            selectedAction:Object,
            elementViewedIndex:Number,
        }
    }

    updated(){
        console.log("hey update : ", this.user)
        if(this.user && !this.gameRef){
            this.gameRef = Datavault.refGetter.getGame(this.user.game);
            this.game = this.gameRef.getDefaultValue();
            this.gameRef.on("value", game => {
                console.log("GAME REFFFFFFFF : ", game)
                this.game = game;
                if(this.mapRenderer){
                    this.mapRenderer.setElements(game.elements);
                    this.mapRenderer.setMapInfos(game.scenario.mapInfos);
                }
            });
        }
    }

    drawMap(){
        setTimeout(()=>{
            let mapContainer = this.shadowRoot.getElementById('map');
            if(mapContainer == undefined){
                return;
            }
            if(!this.mapRenderer){
                this.mapRenderer = new MapRenderer(element=>{
                    this.selectedHexElements = element
                    if(this.selectedHexElements){
                        this.selectedHexElements.sort((a,b)=>{
                            if((a.actif && b.actif) || (!a.actif && !b.actif)){
                                return 0;
                            }
                            if(!a.actif){
                                return 1;
                            }
                            return -1;
                        });
                    }
                    this.elementViewedIndex = 0;
                },result=>{
                    this.selectedAction.result = result;
                    this.gameRef.actions.playAction(this.selectedAction);
                    this.selectedAction = undefined;
                }, this.user.uid);
                this.mapRenderer.setAffSize({height:mapContainer.clientHeight, width:mapContainer.clientWidth});
                this.mapRenderer.setMapInfos(this.game.scenario.mapInfos);
                this.mapRenderer.setElements(this.game.elements);
            }
            window.addEventListener('resize',()=>{
                this.mapRenderer.setAffSize({height:mapContainer.clientHeight, width:mapContainer.clientWidth});
                //let map = this.mapRenderer.getView();
                //mapContainer.replaceChild(map, mapContainer.firstChild);
            });
            let map = this.mapRenderer.getView();
            mapContainer.replaceChild(map, mapContainer.firstChild);
        })
    }

    launchGame(){
        this.shadowRoot.getElementById('launch').textMode = false;
        this.gameRef.actions.launchGame(this.user.game).then(()=>{
            this.emit('toast-msg', 'Game started');
            this.shadowRoot.getElementById('launch').textMode = true;
        }).catch(e=>{
            this.emit('toast-msg', 'Error : the game could not be started');
            this.shadowRoot.getElementById('launch').textMode = true;
        });
    }

    copyStringToClipboard () {
        // Create new element
        var el = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = this.user.game;
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style = {position: 'absolute', left: '-9999px'};
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);

        this.emit('toast-msg', `Game token copied to clipboard`);
     }

     displayToken(){
         return html`<p>Token : ${this.user.game}<img class="ml-1" src='img/game/clipboard-text.png' @click="${this.copyStringToClipboard}"></p>`
     }


    actionSelect(action, selectedElement){
        if(action.direct){
            this.gameRef.actions.playAction(action)
        }else{
            this.selectedAction = action;
            this.mapRenderer.setAction(action, selectedElement);
        }
    }
    actionCancel(action){
        this.gameRef.actions.cancelAction(action);
    }

    controlReceived(e){
        console.log('control : ', e, e.detail)
        if(!this.mapRenderer){
            return;
        }
        let [type, pad] = e.detail.split(':');
        switch (type) {
            case 'zup':
                this.mapRenderer.mapZoom(-pad);
                break;
            case 'zdown':
                this.mapRenderer.mapZoom(pad);
                break;
            case 'left':
                this.mapRenderer.mapMove(pad, 0);
                break;
            case 'right':
                this.mapRenderer.mapMove(-pad, 0);
                break;
            case 'up':
                this.mapRenderer.mapMove(0, pad);
                break;
            case 'down':
                this.mapRenderer.mapMove(0, -pad);
                break;
            default:
                console.warn("unknow control param : ", param)
                break;
        }
    }

    render() {
        return html`
            ${this.styles}
            ${
                this.game.status !== 'loading' ? 
                html`
                    <vrg-element-desc 
                        class="tooltip" 
                        @select-action="${e=>this.actionSelect(e.detail.action, e.detail.element)}" 
                        @cancel-action="${e=>this.actionCancel(e.detail)}" 
                        .elements="${this.selectedHexElements}" 
                        .userId="${this.user.uid}" 
                        .actionId="${this.selectedAction ? this.selectedAction.id : ''}">
                    </vrg-element-desc>
                    <div class="flex-box f-horizontal p-0 h-100">
                        ${
                            this.game.status === "ready" ? 
                            html`<div class="flex-box f-vertical f-j-center w-80 scroll f-a-center" style="position:relative">
                                    <vrg-touchpad @btn-control="${this.controlReceived}" class="controler"></vrg-touchpad>
                                    <div class="map" id="map" @resize="${this.resizeMap}">
                                        ${this.drawMap()}
                                    </div>
                                </div>` : 
                            html`loading`
                        }
                        <div class="flex-box f-vertical w-20 list-deads scroll">
                            <vrg-game-infos 
                                .user="${this.user}">
                            </vrg-game-infos>
                        </div>
                    </div>
                    <game-popin ?hidden=${this.game.status !== "waitingplayers"}>
                        <div class="flex-box f-horizontal">
                            <div class="flex-box f-vertical f-j-start">
                                <div>Players : </div>
                                <ul>
                                    ${this.game.players.map(player=>html`<li style="color:#${player.color}" class="${player.uid === this.user.uid ? 'self': ''}">${player.name}</li>`)}
                                </ul>
                            </div>
                            <div class="flex-box f-vertical">
                                <h3>Preparing</h3>
                                <p>You can invite people to this game by giving this token above. There is no chat for now, so use any other messaging system you'd like for that.</p>
                                <p>When ready, click the button on the right.</p>
                                ${this.displayToken()}
                            </div>
                            <div>
                                <btn-loader id="launch" @click="${this.launchGame}">
                                    launch
                                </btn-loader>
                            </div>
                        </div>
                    </game-popin>
                    <game-popin ?hidden=${this.game.status !== 'inturn'}>
                        <div class="flex-box f-vertical">
                            <div class="flex-box f-horizontal f-j-center">
                                <p>
                                    in turn
                                </p>
                            </div>
                            <div class="flex-box f-horizontal">
                                Please wait for turn resolution
                            </div>
                        </div>
                    </game-popin>`:
                html`<game-popin>loading</game-popin>`
            }
        `;
    }
}

customElements.define('vrg-game', VrgGame); //
