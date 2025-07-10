import { store } from "https://freegd.vercel.app/list/js/main.js";
import { embed } from "https://freegd.vercel.app/list/js/util.js";
import { score } from "https://freegd.vercel.app/list/js/score.js";
import { fetchEditors, fetchList } from "https://freegd.vercel.app/list/js/content.js";

import Spinner from "https://freegd.vercel.app/list/js/components/Spinner.js";
import LevelAuthors from "https://freegd.vercel.app/list/js/components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list" :key="i" :class="{
                        [\`rank\${i + 1}\`]: i + 1 <= 3
                    }">
                        <td class="rank">
                            <p v-if="i + 1 <= 150" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                        <li v-if="level.mapPackPrettyName" :style="{ 
                            backgroundColor: level.mapPackColor,
                            borderRadius: '4px',
                            padding: '8px 12px'
                        }">
                            <div class="type-title-sm" :style="{ color: getContrastColor(level.mapPackColor) }">Map Pack</div>
                            <p :style="{ color: getContrastColor(level.mapPackColor), fontWeight: 'bold' }">{{ level.mapPackPrettyName }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${!store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${!store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements/Rules</h3>
                    <p><h5>
                    <a href="https://docs.google.com/document/d/1PsjbuMw_DU46c2KzaTnrNYqXMqYstzAzoMuBZSwSoeQ/edit?usp=sharing" target="_blank">Click this for rules</a>
                    </h5><p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }
    
            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        mapPackStyle() {
            return this.level.mapPackColor ? { color: this.level.mapPackColor } : {};
        }
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        getContrastColor(hexColor) {
            if (!hexColor) return 'var(--color-on-background)';
            
            hexColor = hexColor.replace('#', '');
            
            let r, g, b;
            if (hexColor.length === 3) {
                r = parseInt(hexColor[0] + hexColor[0], 16);
                g = parseInt(hexColor[1] + hexColor[1], 16);
                b = parseInt(hexColor[2] + hexColor[2], 16);
            } else {
                r = parseInt(hexColor.substr(0, 2), 16);
                g = parseInt(hexColor.substr(2, 2), 16);
                b = parseInt(hexColor.substr(4, 2), 16);
            }
            
            const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            
            return brightness > 0.5 ? '#000000' : '#FFFFFF';
        }
    },
};
