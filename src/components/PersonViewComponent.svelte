<script lang="ts">
	  import { log } from "console";
import { DateInput, Icon, IconButton, Link } from "obsidian-svelte";
	import type { Person } from "src/data/Person";
	import PeopleLink from "./PeopleLink.svelte";
	//export let app: App;
	export let person: Person;

</script>
{#if person}
<h1>{person.name}</h1>

<div class="line"><Icon name="map-pin"/><div>{@html person.address}</div></div>

{#if !isNaN(person.birthday)}
<div class="line"><Icon name="cake"/>{person.birthdayString} ({person.age})</div>
{/if}

{#if person.phone }
<div class="line"><Icon name="phone"/>{person.phone}</div>
{/if}

{#if person.email }
<div class="line"><Icon name="mail"/><a href="mailto:{person.email}">{person.email}</a></div>
{/if}

{#if person.url }
<div class="line"><Icon name="link"/><Link href="{person.url}">{person.url}</Link></div>
{/if}

{#if person.mother}
<PeopleLink href={person.mother}><Icon name="smile"/></PeopleLink>
{/if}

{#if person.father}
<PeopleLink href={person.father}><Icon name="smile"/></PeopleLink>
{/if}

{#each person.children as child}
<PeopleLink href={child}><Icon name="baby" /></PeopleLink>
{/each}
{/if}

<style>
    .line {
		display: flex;
		gap: 4px;
		margin-bottom: 8px;
		font-size: var(--nav-item-size);
    	font-weight: var(--nav-item-weight);
		line-height: 1.5em;
    }
</style>